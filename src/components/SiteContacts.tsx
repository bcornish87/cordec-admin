import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Phone, Mail, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const ROLE_ORDER: Record<string, number> = {
  'Contract Manager': 0,
  'Quantity Surveyor': 1,
  'Site Manager': 2,
  'Assistant Site Manager': 3,
};

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  default_role: string | null;
}

interface SiteContact {
  id: string;
  role: string;
  contact_id: string;
  contact: Contact;
}

export function SiteContacts({
  siteId,
  developerId,
}: {
  siteId: string;
  developerId: string;
}) {
  const [siteContacts, setSiteContacts] = useState<SiteContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [pool, setPool] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const fetchSiteContacts = async () => {
    const { data, error } = await supabase
      .from('site_contacts')
      .select('id, role, contact_id, contact:contacts(id, first_name, last_name, email, phone, is_archived)')
      .eq('site_id', siteId);
    if (error) {
      toast.error('Failed to load site contacts: ' + error.message);
      setLoading(false);
      return;
    }
    setSiteContacts(
      (data || [])
        .filter((row: any) => !row.contact?.is_archived)
        .map((row: any) => ({
          id: row.id,
          role: row.role,
          contact_id: row.contact_id,
          contact: row.contact,
        }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchSiteContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  // Sort by role order
  const sortedContacts = [...siteContacts].sort((a, b) => {
    const ra = ROLE_ORDER[a.role] ?? 99;
    const rb = ROLE_ORDER[b.role] ?? 99;
    return ra - rb || a.contact.first_name.localeCompare(b.contact.first_name);
  });

  const openAssign = async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, phone, default_role')
      .eq('developer_id', developerId)
      .eq('is_archived', false)
      .order('first_name');
    if (error) {
      toast.error('Failed to load contacts: ' + error.message);
      return;
    }
    setPool(data || []);
    // Pre-tick currently assigned contacts
    setSelectedIds(new Set(siteContacts.map(sc => sc.contact_id)));
    setAssignOpen(true);
  };

  const handleSaveAssignments = async () => {
    setSaving(true);
    const currentIds = new Set(siteContacts.map(sc => sc.contact_id));
    const toAdd = [...selectedIds].filter(id => !currentIds.has(id));
    const toRemove = siteContacts.filter(sc => !selectedIds.has(sc.contact_id));

    // Remove unselected
    if (toRemove.length > 0) {
      const { error } = await supabase
        .from('site_contacts')
        .delete()
        .in('id', toRemove.map(sc => sc.id));
      if (error) {
        toast.error('Failed to remove contacts: ' + error.message);
        setSaving(false);
        return;
      }
    }

    // Add newly selected
    if (toAdd.length > 0) {
      const rows = toAdd.map(contactId => {
        const c = pool.find(p => p.id === contactId);
        return {
          site_id: siteId,
          contact_id: contactId,
          role: c?.default_role || 'Site Manager',
        };
      });
      const { error } = await supabase.from('site_contacts').insert(rows);
      if (error) {
        toast.error('Failed to assign contacts: ' + error.message);
        setSaving(false);
        return;
      }
    }

    if (toAdd.length > 0 || toRemove.length > 0) {
      toast.success('Contacts updated');
    }
    setAssignOpen(false);
    setSaving(false);
    await fetchSiteContacts();
  };

  const handleRemove = async (scId: string) => {
    const { error } = await supabase
      .from('site_contacts')
      .delete()
      .eq('id', scId);
    if (error) {
      toast.error('Remove failed: ' + error.message);
      return;
    }
    setSiteContacts(prev => prev.filter(sc => sc.id !== scId));
    toast.success('Contact removed from site');
  };

  // Sort pool by role order for the dialog
  const sortedPool = [...pool].sort((a, b) => {
    const ra = ROLE_ORDER[a.default_role ?? ''] ?? 99;
    const rb = ROLE_ORDER[b.default_role ?? ''] ?? 99;
    return ra - rb || a.first_name.localeCompare(b.first_name);
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Site Contacts</h3>
        <Button size="sm" variant="outline" onClick={openAssign}>
          <Plus className="mr-2 h-3.5 w-3.5" />Assign
        </Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : sortedContacts.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No contacts assigned.
        </p>
      ) : (
        <div className="border rounded-lg bg-card divide-y divide-border">
          {sortedContacts.map(sc => (
            <div
              key={sc.id}
              className="flex items-center gap-3 px-4 py-2.5 text-sm"
            >
              <span className="text-xs text-muted-foreground w-32 shrink-0 truncate">{sc.role}</span>
              <span className="flex-1 font-medium truncate">
                {sc.contact.first_name} {sc.contact.last_name}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {sc.contact.phone && (
                  <a
                    href={`tel:${sc.contact.phone}`}
                    className="rounded p-1 hover:bg-accent text-muted-foreground hover:text-foreground"
                    aria-label={`Call ${sc.contact.first_name}`}
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                )}
                {sc.contact.email && (
                  <a
                    href={`mailto:${sc.contact.email}`}
                    className="rounded p-1 hover:bg-accent text-muted-foreground hover:text-foreground"
                    aria-label={`Email ${sc.contact.first_name}`}
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(sc.id)}
                  className="rounded p-1 hover:bg-destructive hover:text-destructive-foreground text-muted-foreground"
                  aria-label="Remove contact from site"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Contacts Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Contacts to Site</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {pool.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No contacts for this developer yet. Add contacts from the developer page first.
              </p>
            ) : (
              <div className="space-y-1 max-h-80 overflow-y-auto">
                {sortedPool.map(c => (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={selectedIds.has(c.id)}
                      onCheckedChange={(checked) => {
                        setSelectedIds(prev => {
                          const next = new Set(prev);
                          if (checked) next.add(c.id);
                          else next.delete(c.id);
                          return next;
                        });
                      }}
                    />
                    <span className="flex-1 font-medium">{c.first_name} {c.last_name}</span>
                    {c.default_role && (
                      <span className="text-xs text-muted-foreground">{c.default_role}</span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAssignments} disabled={saving || pool.length === 0}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
