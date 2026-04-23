import { supabase } from '@/lib/supabase';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { SUPABASE_URL } from '@/pages/clients/types';

/* ------------------------------------------------------------------ */
/*  Developers                                                         */
/* ------------------------------------------------------------------ */

export async function fetchDevelopers(): Promise<any[]> {
  const { data, error } = await supabase
    .from('developers')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export interface DeveloperStats {
  developer_id: string;
  site_count: number | string;
  unit_count: number | string;
}

export async function fetchDeveloperStats(): Promise<DeveloperStats[]> {
  const { data, error } = await supabase.rpc('get_developer_stats');
  if (error) throw error;
  return (data ?? []) as DeveloperStats[];
}

export async function insertDeveloper(payload: TablesInsert<'developers'>): Promise<void> {
  const { error } = await supabase.from('developers').insert(payload);
  if (error) throw error;
}

export async function updateDeveloper(
  id: string,
  payload: TablesUpdate<'developers'>,
): Promise<void> {
  const { error } = await supabase.from('developers').update(payload).eq('id', id);
  if (error) throw error;
}

export async function setDeveloperArchived(id: string, value: boolean): Promise<void> {
  const { error } = await supabase
    .from('developers')
    .update({ is_archived: value })
    .eq('id', id);
  if (error) throw error;
}

/**
 * Upload a developer logo to the `logos` bucket and return its public URL.
 */
export async function uploadDeveloperLogo(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `developers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from('logos')
    .upload(path, file, { upsert: true });
  if (error) throw error;
  return `${SUPABASE_URL}/storage/v1/object/public/logos/${path}`;
}

/* ------------------------------------------------------------------ */
/*  Contacts                                                           */
/* ------------------------------------------------------------------ */

/**
 * Slim list of a developer's active contacts: id + name + default_role.
 * Used by the create-/edit-site dialog to show assignable contacts.
 */
export async function fetchSlimContactsByDeveloper(
  developerId: string,
): Promise<Array<{ id: string; first_name: string; last_name: string; default_role: string | null }>> {
  const { data, error } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, default_role')
    .eq('developer_id', developerId)
    .eq('is_archived', false)
    .order('first_name');
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; first_name: string; last_name: string; default_role: string | null }>;
}

/**
 * Active contacts for a developer with email + phone (used by the
 * "Assign contacts to site" dialog pool).
 */
export async function fetchAssignableContactsByDeveloper(developerId: string) {
  const { data, error } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email, phone, default_role')
    .eq('developer_id', developerId)
    .eq('is_archived', false)
    .order('first_name');
  if (error) throw error;
  return (data ?? []) as any[];
}

/**
 * Full developer-contacts list with embedded site_contacts(role, site_id,
 * site:sites(name)) used by the Developer Contacts page table.
 */
export async function fetchContactsByDeveloperWithAssignments(
  developerId: string,
) {
  const { data, error } = await supabase
    .from('contacts')
    .select(
      'id, first_name, last_name, email, phone, default_role, is_archived, notify_issue_report, notify_hourly_agreement, notify_sign_off, notify_quality_report, site_contacts(role, site_id, site:sites(name))',
    )
    .eq('developer_id', developerId)
    .order('last_name');
  if (error) throw error;
  return (data ?? []) as any[];
}

/**
 * Insert a contact row and return its id (caller pre-merges developer_id).
 */
export async function insertContact(
  payload: TablesInsert<'contacts'>,
): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('contacts')
    .insert(payload)
    .select('id')
    .single();
  if (error) throw error;
  return data as { id: string };
}

export async function updateContact(
  id: string,
  payload: TablesUpdate<'contacts'>,
): Promise<void> {
  const { error } = await supabase.from('contacts').update(payload).eq('id', id);
  if (error) throw error;
}

export async function setContactArchived(id: string, value: boolean): Promise<void> {
  const { error } = await supabase
    .from('contacts')
    .update({ is_archived: value })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from('contacts').delete().eq('id', id);
  if (error) throw error;
}

export type ContactNotificationField =
  | 'notify_issue_report'
  | 'notify_hourly_agreement'
  | 'notify_sign_off'
  | 'notify_quality_report';

/**
 * Toggle a single notification flag (notify_issue_report, etc) on a contact.
 */
export async function updateContactNotification(
  id: string,
  field: ContactNotificationField,
  value: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('contacts')
    .update({ [field]: value } as TablesUpdate<'contacts'>)
    .eq('id', id);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Site contacts (junction table)                                     */
/* ------------------------------------------------------------------ */

/**
 * Fetch the joined contact rows currently assigned to a site (used by the
 * Site Contacts panel). Returns the raw nested supabase shape; caller does
 * the is_archived filter + role-order sort.
 */
export async function fetchSiteContactsForSite(siteId: string) {
  const { data, error } = await supabase
    .from('site_contacts')
    .select(
      'id, role, contact_id, contact:contacts(id, first_name, last_name, email, phone, is_archived)',
    )
    .eq('site_id', siteId);
  if (error) throw error;
  return (data ?? []) as any[];
}

/**
 * Just the contact ids assigned to a site — used by the SitesList edit
 * dialog to pre-tick checkboxes.
 */
export async function fetchSiteContactIds(siteId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('site_contacts')
    .select('contact_id')
    .eq('site_id', siteId);
  if (error) throw error;
  return ((data ?? []) as Array<{ contact_id: string }>).map(r => r.contact_id);
}

export async function insertSiteContacts(
  rows: Array<{ site_id: string; contact_id: string; role: string }>,
): Promise<void> {
  const { error } = await supabase.from('site_contacts').insert(rows);
  if (error) throw error;
}

export async function deleteSiteContact(id: string): Promise<void> {
  const { error } = await supabase.from('site_contacts').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteSiteContactsByIds(ids: string[]): Promise<void> {
  const { error } = await supabase.from('site_contacts').delete().in('id', ids);
  if (error) throw error;
}

/**
 * Detach specific contacts from a site (used when editing a site).
 */
export async function deleteSiteContactsForSite(
  siteId: string,
  contactIds: string[],
): Promise<void> {
  const { error } = await supabase
    .from('site_contacts')
    .delete()
    .eq('site_id', siteId)
    .in('contact_id', contactIds);
  if (error) throw error;
}

/**
 * Detach a contact from specific sites (used when editing a contact).
 */
export async function deleteSiteContactsForContact(
  contactId: string,
  siteIds: string[],
): Promise<void> {
  const { error } = await supabase
    .from('site_contacts')
    .delete()
    .eq('contact_id', contactId)
    .in('site_id', siteIds);
  if (error) throw error;
}
