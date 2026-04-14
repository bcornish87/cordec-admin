import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ChevronDown, Plus, X, Pencil, Archive as ArchiveIcon, Upload } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { siteFields, type SiteRow } from './types';
import {
  fetchSitesByDeveloperWithPlotCount,
  insertSite,
  updateSite,
  uploadSitePlanForNewSite,
} from '@/api/sites';
import { insertPlot } from '@/api/plots';
import {
  fetchSlimContactsByDeveloper,
  fetchSiteContactIds,
  insertSiteContacts,
  deleteSiteContactsForSite,
} from '@/api/clients';

/**
 * Level 2 list. Sites for one developer. Each row is just the site name with Edit
 * and Archive actions; archived sites are shown in a collapsible section.
 */
export function SitesList({
  developerId,
  onOpen,
}: {
  developerId: string;
  onOpen: (site: { id: string; name: string }) => void;
}) {
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SiteRow | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [devContacts, setDevContacts] = useState<{ id: string; first_name: string; last_name: string; default_role: string | null }[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  const fetchDevContacts = async () => {
    try {
      const data = await fetchSlimContactsByDeveloper(developerId);
      setDevContacts(data);
    } catch {
      // Match prior behaviour: silently ignore failure (caller didn't toast).
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    let data: any[];
    try {
      data = await fetchSitesByDeveloperWithPlotCount(developerId);
    } catch (err) {
      toast.error('Load failed: ' + (err as Error).message);
      setLoading(false);
      return;
    }
    setSites(data.map((s: any) => ({ ...s, plot_count: s.plots?.length ?? 0 })) as SiteRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    fetchDevContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [developerId]);

  const active = sites.filter(s => !s.is_archived);
  const archived = sites.filter(s => s.is_archived);

  // Fields shown in the create/edit dialog. developer_id is set automatically and
  // never appears as an input. site_plans is the only file field — the rest are
  // text or select.
  const editableFields = siteFields.filter(f => f.key !== 'developer_id');

  const openCreate = () => {
    setEditing(null);
    const fd: Record<string, string> = {};
    editableFields.forEach(f => {
      fd[f.key] = '';
    });
    fd.status = 'active';
    setFormData(fd);
    setSelectedContactIds([]);
    setDialogOpen(true);
  };

  const openEdit = async (site: SiteRow) => {
    setEditing(site);
    const fd: Record<string, string> = {};
    editableFields.forEach(f => {
      const v = site[f.key];
      fd[f.key] = v == null ? '' : String(v);
    });
    setFormData(fd);
    // Load current site contacts
    try {
      setSelectedContactIds(await fetchSiteContactIds(site.id));
    } catch {
      setSelectedContactIds([]);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload: Record<string, unknown> = { ...formData };
    if (editing) {
      try {
        await updateSite(editing.id, payload as Record<string, string | number | null>);
        // Sync contacts: get current, diff, add/remove
        const currentIds = await fetchSiteContactIds(editing.id);
        const toRemove = currentIds.filter((id: string) => !selectedContactIds.includes(id));
        const toAdd = selectedContactIds.filter(id => !currentIds.includes(id));
        if (toRemove.length > 0) {
          await deleteSiteContactsForSite(editing.id, toRemove);
        }
        if (toAdd.length > 0) {
          const rows = toAdd.map(contactId => {
            const c = devContacts.find(dc => dc.id === contactId);
            return { site_id: editing.id, contact_id: contactId, role: c?.default_role || 'Site Manager' };
          });
          await insertSiteContacts(rows);
        }
        toast.success('Saved');
        setDialogOpen(false);
        await fetchAll();
      } catch (err) {
        toast.error('Update failed: ' + (err as Error).message);
      }
    } else {
      payload.developer_id = developerId;
      try {
        const newSite = await insertSite(payload);
        await insertPlot({
          site_id: newSite.id,
          plot_name: '1',
          status: 'not_started',
          sort_order: 0,
        });
        // Assign selected contacts
        if (selectedContactIds.length > 0) {
          const rows = selectedContactIds.map(contactId => {
            const c = devContacts.find(dc => dc.id === contactId);
            return { site_id: newSite.id, contact_id: contactId, role: c?.default_role || 'Site Manager' };
          });
          await insertSiteContacts(rows);
        }
        toast.success('Created');
        setDialogOpen(false);
        await fetchAll();
      } catch (err) {
        toast.error('Create failed: ' + (err as Error).message);
      }
    }
    setSaving(false);
  };

  const setArchived = async (id: string, value: boolean) => {
    try {
      await updateSite(id, { is_archived: value });
    } catch (err) {
      toast.error((value ? 'Archive' : 'Restore') + ' failed: ' + (err as Error).message);
      return;
    }
    setSites(prev =>
      prev.map(s => (s.id === id ? { ...s, is_archived: value } : s))
    );
    toast.success(value ? 'Site archived' : 'Site restored');
  };

  const updateSiteStatus = async (id: string, status: string) => {
    try {
      await updateSite(id, { status });
    } catch (err) {
      toast.error('Status update failed: ' + (err as Error).message);
      return;
    }
    setSites(prev =>
      prev.map(s => (s.id === id ? { ...s, status } : s))
    );
  };

  const handleSitePlanUpload = async (file: File) => {
    let url: string;
    try {
      url = await uploadSitePlanForNewSite(file);
    } catch (err) {
      toast.error('Upload failed: ' + (err as Error).message);
      return;
    }
    setFormData(p => ({ ...p, site_plans: url }));
    toast.success('Site plan uploaded');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Sites</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Active: {active.length} &middot; Archived: {archived.length} &middot; Total: {sites.length}
          </p>
          <p className="text-sm text-muted-foreground">
            Units: {active.reduce((s, site) => s + site.plot_count, 0)}
          </p>
        </div>
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
            <Plus className="mr-2 h-4 w-4" />Add Site
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : showArchived ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Archived Sites</h3>
          {archived.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No archived sites</p>
          ) : (
            <div className="border rounded-lg bg-card">
              <Table className="table-fixed">
                <colgroup>
                  <col className="w-[60%]" />
                  <col className="w-[40%]" />
                </colgroup>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-9 text-center">Name</TableHead>
                    <TableHead className="h-9 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archived.map(site => (
                    <TableRow key={site.id}>
                      <TableCell className="py-2 text-center text-muted-foreground">{site.name}</TableCell>
                      <TableCell className="py-2 text-center">
                        <Button variant="outline" size="sm" onClick={() => setArchived(site.id, false)}>
                          Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      ) : active.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No sites yet. Click "Add Site" to create one.</p>
      ) : (
        <div className="border rounded-lg bg-card">
          <Table className="table-fixed">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[15%]" />
              <col className="w-[15%]" />
              <col className="w-[40%]" />
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 text-center">Name</TableHead>
                <TableHead className="h-9 text-center">Units</TableHead>
                <TableHead className="h-9 text-center">Status</TableHead>
                <TableHead className="h-9 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {active.map(site => {
                const isActive = site.status !== 'inactive';
                return (
                <TableRow
                  key={site.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onOpen({ id: site.id, name: site.name })}
                >
                  <TableCell className="py-2 text-center font-medium">{site.name}</TableCell>
                  <TableCell className="py-2 text-center">{site.plot_count}</TableCell>
                  <TableCell className="py-2 text-center" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger className={`inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors outline-none ${
                        isActive
                          ? 'bg-green-500/15 text-green-500 hover:bg-green-500/25'
                          : 'bg-red-500/15 text-red-500 hover:bg-red-500/25'
                      }`}>
                        {isActive ? 'Active' : 'Inactive'} <ChevronDown className="h-3 w-3 opacity-50" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center">
                        <DropdownMenuItem onClick={() => updateSiteStatus(site.id, 'active')}>
                          <span className="text-green-500">Active</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updateSiteStatus(site.id, 'inactive')}>
                          <span className="text-red-500">Inactive</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="py-2 text-center" onClick={e => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(site)}>
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setArchived(site.id, true)}>
                        <ArchiveIcon className="h-3.5 w-3.5 mr-1.5" />Archive
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Site' : 'Create Site'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {editableFields.map(f => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                {f.type === 'select' && f.options ? (
                  <Select
                    value={formData[f.key] || ''}
                    onValueChange={v => setFormData(p => ({ ...p, [f.key]: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${f.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options.map(o => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : f.type === 'file' ? (
                  <div className="space-y-2">
                    {formData.site_plans && (
                      <div className="flex items-center gap-2 text-sm border rounded-md px-3 py-2 w-fit">
                        <a
                          href={formData.site_plans}
                          target="_blank"
                          rel="noreferrer"
                          className="underline truncate max-w-[260px]"
                        >
                          {formData.site_plans.split('/').pop()}
                        </a>
                        <button
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, site_plans: '' }))}
                          className="rounded-full bg-destructive text-destructive-foreground h-5 w-5 flex items-center justify-center"
                          aria-label="Remove file"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground border rounded-md px-3 py-2 w-fit">
                      <Upload className="h-4 w-4" />
                      {formData.site_plans ? 'Replace file' : 'Upload file'}
                      <input
                        type="file"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleSitePlanUpload(file);
                        }}
                      />
                    </label>
                  </div>
                ) : (
                  <Input
                    value={formData[f.key] || ''}
                    onChange={e =>
                      setFormData(p => ({ ...p, [f.key]: e.target.value }))
                    }
                    required={f.required}
                  />
                )}
              </div>
            ))}
            {devContacts.length > 0 && (
              <div className="space-y-1.5">
                <Label>Contacts</Label>
                <div className="space-y-2 rounded-md border p-3 max-h-40 overflow-y-auto">
                  {devContacts.map(c => (
                    <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selectedContactIds.includes(c.id)}
                        onCheckedChange={(checked) => {
                          setSelectedContactIds(prev =>
                            checked
                              ? [...prev, c.id]
                              : prev.filter(id => id !== c.id)
                          );
                        }}
                      />
                      {c.first_name} {c.last_name}
                      {c.default_role && (
                        <span className="text-muted-foreground">— {c.default_role}</span>
                      )}
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
