import { supabase } from '@/lib/supabase';
import { SUPABASE_URL } from '@/pages/clients/types';

export interface SiteLocation {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
}

export interface SiteDetail {
  name: string;
  address: string | null;
  grid_reference: string | null;
  latitude: number | null;
  longitude: number | null;
  site_plans: string | null;
}

/**
 * Fetch active sites that have lat/lng coordinates, for the dashboard map.
 * Filters: is_archived=false AND latitude IS NOT NULL AND longitude IS NOT NULL.
 */
export function fetchMappedSites() {
  return supabase
    .from('sites')
    .select('id, name, latitude, longitude')
    .eq('is_archived', false)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);
}

/**
 * Fetch a single site's editable detail fields (used by SiteInfoPanel).
 */
export async function fetchSiteDetail(siteId: string): Promise<SiteDetail> {
  const { data, error } = await supabase
    .from('sites')
    .select('name, address, grid_reference, latitude, longitude, site_plans')
    .eq('id', siteId)
    .single();
  if (error) throw error;
  return data as SiteDetail;
}

/**
 * Patch a site row by id. Accepts any column → value mapping; caller is
 * responsible for sanitising values (trimming, parseFloat, etc.).
 */
export async function updateSite(
  siteId: string,
  patch: Record<string, string | number | boolean | null>,
): Promise<void> {
  const { error } = await supabase.from('sites').update(patch).eq('id', siteId);
  if (error) throw error;
}

/**
 * Upload a site-plan file to the `site-plans` storage bucket and return its
 * public URL. Uses upsert=true so re-uploads with the same path overwrite.
 */
export async function uploadSitePlan(siteId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `sites/${siteId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('site-plans').upload(path, file, { upsert: true });
  if (error) throw error;
  return `${SUPABASE_URL}/storage/v1/object/public/site-plans/${path}`;
}

/**
 * Upload a site-plan file from the create-site dialog (no site id yet).
 * Path lives at the bucket root rather than under sites/<siteId>/.
 */
export async function uploadSitePlanForNewSite(file: File): Promise<string> {
  const ext = file.name.split('.').pop();
  const path = `sites/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('site-plans').upload(path, file, { upsert: true });
  if (error) throw error;
  return `${SUPABASE_URL}/storage/v1/object/public/site-plans/${path}`;
}

/**
 * Insert a new site row and return its id. Caller passes the full payload
 * (developer_id, name, address, etc).
 */
export async function insertSite(payload: Record<string, unknown>): Promise<{ id: string }> {
  const { data, error } = await supabase.from('sites').insert(payload).select('id').single();
  if (error) throw error;
  return data as { id: string };
}

/**
 * List a developer's sites with the embedded plots(id) join used by SitesList
 * to compute per-site plot counts. Returns rows in name-asc order.
 */
export async function fetchSitesByDeveloperWithPlotCount(developerId: string) {
  const { data, error } = await supabase
    .from('sites')
    .select('*, plots(id)')
    .eq('developer_id', developerId)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as any[];
}

/**
 * Slim list of a developer's active sites (id + name only). Used by the
 * developer-contacts dialog to show site assignments.
 */
export async function fetchActiveSitesByDeveloper(
  developerId: string,
): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await supabase
    .from('sites')
    .select('id, name')
    .eq('developer_id', developerId)
    .eq('is_archived', false)
    .order('name');
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; name: string }>;
}
