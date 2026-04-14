import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus, Archive as ArchiveIcon, ArrowUpDown, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchContactsByDeveloperWithAssignments,
  insertContact,
  updateContact,
  setContactArchived,
  deleteContact,
  updateContactNotification,
  insertSiteContacts,
  deleteSiteContactsForContact,
} from '@/api/clients';
import { fetchActiveSitesByDeveloper } from '@/api/sites';

const ROLES = [
  'Contract Manager',
  'Site Manager',
  'Quantity Surveyor',
  'Assistant Site Manager',
] as const;

interface SiteOption {
  id: string;
  name: string;
}

interface SiteAssignment {
  site_id: string;
  site_name: string;
  role: string;
}

interface ContactRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  default_role: string | null;
  is_archived: boolean;
  notify_issue_report: boolean;
  notify_hourly_agreement: boolean;
  notify_sign_off: boolean;
  notify_quality_report: boolean;
  assignments: SiteAssignment[];
}

const NOTIFICATION_FIELDS = [
  { key: 'notify_issue_report', label: 'Issue Reports' },
  { key: 'notify_hourly_agreement', label: 'Hourly Agreements' },
  { key: 'notify_sign_off', label: 'Sign Offs' },
  { key: 'notify_quality_report', label: 'Quality Reports' },
] as const;

export function DeveloperContacts({ developerId }: { developerId: string }) {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContactRow | null>(null);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone: '', default_role: '' });
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'role'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const ROLE_ORDER: Record<string, number> = {
    'Contract Manager': 0,
    'Site Manager': 1,
    'Assistant Site Manager': 2,
    'Quantity Surveyor': 3,
  };

  const active = contacts.filter(c => !c.is_archived);
  const archived = contacts.filter(c => c.is_archived);

  const sortedContacts = useMemo(() => {
    const cmpName = (a: ContactRow, b: ContactRow) =>
      a.first_name.localeCompare(b.first_name, undefined, { sensitivity: 'base' })
      || a.last_name.localeCompare(b.last_name, undefined, { sensitivity: 'base' });

    return [...active].sort((a, b) => {
      let cmp: number;
      if (sortBy === 'role') {
        const ra = ROLE_ORDER[a.default_role ?? ''] ?? 99;
        const rb = ROLE_ORDER[b.default_role ?? ''] ?? 99;
        cmp = ra - rb || cmpName(a, b);
      } else {
        cmp = cmpName(a, b);
      }
      return sortAsc ? cmp : -cmp;
    });
  }, [active, sortBy, sortAsc]);

  const toggleSort = (col: 'name' | 'role') => {
    if (sortBy === col) setSortAsc(prev => !prev);
    else { setSortBy(col); setSortAsc(true); }
  };

  const fetchContacts = async () => {
    setLoading(true);
    let data: any[];
    try {
      data = await fetchContactsByDeveloperWithAssignments(developerId);
    } catch (err) {
      toast.error('Failed to load contacts: ' + (err as Error).message);
      setLoading(false);
      return;
    }
    setContacts(
      data.map((c: any) => ({
        id: c.id,
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        phone: c.phone,
        default_role: c.default_role,
        is_archived: c.is_archived,
        notify_issue_report: c.notify_issue_report,
        notify_hourly_agreement: c.notify_hourly_agreement,
        notify_sign_off: c.notify_sign_off,
        notify_quality_report: c.notify_quality_report,
        assignments: (c.site_contacts || []).map((sc: any) => ({
          site_id: sc.site_id,
          site_name: sc.site?.name ?? 'Unknown',
          role: sc.role,
        })),
      }))
    );
    setLoading(false);
  };

  const fetchSites = async () => {
    try {
      setSites(await fetchActiveSitesByDeveloper(developerId));
    } catch {
      // Match prior behaviour: silently ignore failure (caller didn't toast).
    }
  };

  useEffect(() => {
    fetchContacts();
    fetchSites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [developerId]);

  const openCreate = () => {
    setEditing(null);
    setFormData({ first_name: '', last_name: '', email: '', phone: '', default_role: '' });
    setSelectedSiteIds([]);
    setDialogOpen(true);
  };

  const openEdit = (contact: ContactRow) => {
    setEditing(contact);
    setFormData({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      default_role: contact.default_role ?? '',
    });
    setSelectedSiteIds(contact.assignments.map(a => a.site_id));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error('First name and last name are required');
      return;
    }
    setSaving(true);
    const payload = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      default_role: formData.default_role || null,
    };

    if (editing) {
      try {
        await updateContact(editing.id, payload);
      } catch (err) {
        toast.error('Update failed: ' + (err as Error).message);
        setSaving(false);
        return;
      }
      // Sync site assignments: diff current vs selected
      const currentSiteIds = editing.assignments.map(a => a.site_id);
      const toAdd = selectedSiteIds.filter(id => !currentSiteIds.includes(id));
      const toRemove = currentSiteIds.filter(id => !selectedSiteIds.includes(id));
      const role = payload.default_role || editing.default_role;
      if (toRemove.length > 0) {
        await deleteSiteContactsForContact(editing.id, toRemove);
      }
      if (toAdd.length > 0 && role) {
        await insertSiteContacts(
          toAdd.map(siteId => ({
            site_id: siteId,
            contact_id: editing.id,
            role,
          }))
        );
      }
      toast.success('Contact updated');
    } else {
      if (!payload.default_role) {
        toast.error('Please select a role');
        setSaving(false);
        return;
      }
      let newContact: { id: string };
      try {
        newContact = await insertContact({ ...payload, developer_id: developerId });
      } catch (err) {
        toast.error('Create failed: ' + (err as Error).message);
        setSaving(false);
        return;
      }
      if (selectedSiteIds.length > 0 && newContact) {
        const rows = selectedSiteIds.map(siteId => ({
          site_id: siteId,
          contact_id: newContact.id,
          role: payload.default_role!,
        }));
        try {
          await insertSiteContacts(rows);
        } catch (err) {
          toast.error('Contact created but site assignment failed: ' + (err as Error).message);
          setSaving(false);
          setDialogOpen(false);
          await fetchContacts();
          return;
        }
      }
      toast.success('Contact created');
    }
    setDialogOpen(false);
    setSaving(false);
    await fetchContacts();
  };

  const setArchived = async (id: string, value: boolean) => {
    try {
      await setContactArchived(id, value);
    } catch (err) {
      toast.error((value ? 'Archive' : 'Restore') + ' failed: ' + (err as Error).message);
      return;
    }
    const updated = contacts.map(c => (c.id === id ? { ...c, is_archived: value } : c));
    setContacts(updated);
    if (!value && updated.filter(c => c.is_archived).length === 0) {
      setShowArchived(false);
    }
    toast.success(value ? 'Contact archived' : 'Contact restored');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContact(id);
    } catch (err) {
      toast.error('Delete failed: ' + (err as Error).message);
      return;
    }
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    if (updated.filter(c => c.is_archived).length === 0) {
      setShowArchived(false);
    }
    toast.success('Contact deleted');
  };

  const toggleNotification = async (contactId: string, field: typeof NOTIFICATION_FIELDS[number]['key'], value: boolean) => {
    try {
      await updateContactNotification(contactId, field, value);
    } catch {
      toast.error('Failed to update notification preference');
      return;
    }
    setContacts(prev => prev.map(c => c.id === contactId ? { ...c, [field]: value } : c));
    if (editing?.id === contactId) {
      setEditing(prev => prev ? { ...prev, [field]: value } : prev);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Contacts</h2>
        <div className="flex items-center gap-2">
          {archived.length > 0 && (
            <Button
              variant={showArchived ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowArchived(s => !s)}
            >
              <ArchiveIcon className="mr-2 h-4 w-4" />
              Archived ({archived.length})
            </Button>
          )}
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />Add Contact
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : showArchived ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Archived Contacts</h3>
          {archived.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No archived contacts</p>
          ) : (
            <div className="border rounded-lg bg-card">
              <Table className="table-fixed">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[30%]" />
                  <col className="w-[40%]" />
                </colgroup>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-9">Name</TableHead>
                    <TableHead className="h-9">Role</TableHead>
                    <TableHead className="h-9 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archived.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="py-2 text-muted-foreground">
                        {c.first_name} {c.last_name}
                      </TableCell>
                      <TableCell className="py-2 text-sm text-muted-foreground">
                        {c.default_role ?? '—'}
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        <div className="inline-flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setArchived(c.id, false)}>
                            Restore
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(c.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      ) : active.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No contacts yet. Click "Add Contact" to create one.
        </p>
      ) : (
        <div className="border rounded-lg bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 min-w-[160px]">
                  <button type="button" onClick={() => toggleSort('name')} className="inline-flex items-center gap-1 hover:text-foreground">
                    Name <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="h-9 min-w-[140px]">
                  <button type="button" onClick={() => toggleSort('role')} className="inline-flex items-center gap-1 hover:text-foreground">
                    Role <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
                <TableHead className="h-9 min-w-[160px]">Assigned Sites</TableHead>
                {NOTIFICATION_FIELDS.map(({ key, label }) => (
                  <TableHead key={key} className="h-9 text-center min-w-[100px]">{label}</TableHead>
                ))}
                <TableHead className="h-9 text-center min-w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedContacts.map(c => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => openEdit(c)}
                >
                  <TableCell className="py-2 font-medium">
                    {c.first_name} {c.last_name}
                  </TableCell>
                  <TableCell className="py-2 text-sm text-muted-foreground">
                    {c.default_role ?? '—'}
                  </TableCell>
                  <TableCell className="py-2">
                    {c.assignments.length === 0 ? (
                      <span className="text-muted-foreground text-xs italic">Unassigned</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {c.assignments.map((a, i) => (
                          <Badge key={i} variant="secondary" className="text-xs whitespace-nowrap">
                            {a.site_name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  {NOTIFICATION_FIELDS.map(({ key }) => (
                    <TableCell key={key} className="py-2 text-center" onClick={e => e.stopPropagation()}>
                      <Switch
                        checked={c[key]}
                        onCheckedChange={(checked) => toggleNotification(c.id, key, checked)}
                      />
                    </TableCell>
                  ))}
                  <TableCell className="py-2 text-center" onClick={e => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setArchived(c.id, true)}
                    >
                      <ArchiveIcon className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create / Edit Contact Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input
                  value={formData.first_name}
                  onChange={e => setFormData(p => ({ ...p, first_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <Input
                  value={formData.last_name}
                  onChange={e => setFormData(p => ({ ...p, last_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={formData.default_role}
                onValueChange={v => setFormData(p => ({ ...p, default_role: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
              />
            </div>
            {sites.length > 0 && (
              <div className="space-y-1.5">
                <Label>Assign to Sites</Label>
                <div className="space-y-2 rounded-md border p-3 max-h-40 overflow-y-auto">
                  {sites.map(s => (
                    <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selectedSiteIds.includes(s.id)}
                        onCheckedChange={(checked) => {
                          setSelectedSiteIds(prev =>
                            checked
                              ? [...prev, s.id]
                              : prev.filter(id => id !== s.id)
                          );
                        }}
                      />
                      {s.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
