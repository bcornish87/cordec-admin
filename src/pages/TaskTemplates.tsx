import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, ChevronUp, ChevronDown, Archive as ArchiveIcon } from 'lucide-react';
import { toast } from 'sonner';

interface TaskTemplate {
  id: string;
  name: string;
  type: 'internal' | 'garage' | 'external';
  sort_order: number;
  is_default: boolean;
}

const GROUPS: Array<{ type: 'internal' | 'garage' | 'external'; label: string }> = [
  { type: 'internal', label: 'Internal' },
  { type: 'garage', label: 'Garages' },
  { type: 'external', label: 'External' },
];

export function TaskTemplatesSection() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [archived, setArchived] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaskTemplate | null>(null);
  const [form, setForm] = useState<{ name: string; type: 'internal' | 'garage' | 'external'; is_default: boolean }>({
    name: '',
    type: 'internal',
    is_default: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    const [activeRes, archivedRes] = await Promise.all([
      supabase.from('task_templates').select('*').eq('archived', false).order('type').order('sort_order'),
      supabase.from('task_templates').select('*').eq('archived', true).order('type').order('name'),
    ]);
    if (activeRes.error) toast.error('Failed to load: ' + activeRes.error.message);
    else setTemplates((activeRes.data || []) as TaskTemplate[]);
    setArchived((archivedRes.data || []) as TaskTemplate[]);
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', type: 'internal', is_default: true });
    setDialogOpen(true);
  };

  const openEdit = (t: TaskTemplate) => {
    setEditing(t);
    setForm({ name: t.name, type: t.type, is_default: t.is_default });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const name = form.name.trim();
    if (!name) { toast.error('Name is required'); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase
        .from('task_templates')
        .update({ name, type: form.type, is_default: form.is_default })
        .eq('id', editing.id);
      if (error) toast.error('Update failed: ' + error.message);
      else { toast.success('Updated'); setDialogOpen(false); fetchTemplates(); }
    } else {
      const sameType = templates.filter(t => t.type === form.type);
      const nextOrder = sameType.length > 0 ? Math.max(...sameType.map(t => t.sort_order)) + 1 : 1;
      const { error } = await supabase
        .from('task_templates')
        .insert({ name, type: form.type, is_default: form.is_default, sort_order: nextOrder });
      if (error) toast.error('Create failed: ' + error.message);
      else { toast.success('Created'); setDialogOpen(false); fetchTemplates(); }
    }
    setSaving(false);
  };

  const handleArchive = async (id: string) => {
    const { error } = await supabase.from('task_templates').update({ archived: true }).eq('id', id);
    if (error) toast.error('Archive failed: ' + error.message);
    else { toast.success('Task archived'); fetchTemplates(); }
  };

  const handleRestore = async (id: string) => {
    const { error } = await supabase.from('task_templates').update({ archived: false }).eq('id', id);
    if (error) toast.error('Restore failed: ' + error.message);
    else {
      toast.success('Task restored');
      await fetchTemplates();
      if (archived.length <= 1) setShowArchived(false);
    }
  };

  const move = async (template: TaskTemplate, dir: -1 | 1) => {
    const group = templates
      .filter(t => t.type === template.type)
      .sort((a, b) => a.sort_order - b.sort_order);
    const idx = group.findIndex(t => t.id === template.id);
    const swap = group[idx + dir];
    if (!swap) return;
    const a = template.sort_order;
    const b = swap.sort_order;
    setTemplates(prev =>
      prev.map(t => {
        if (t.id === template.id) return { ...t, sort_order: b };
        if (t.id === swap.id) return { ...t, sort_order: a };
        return t;
      })
    );
    await Promise.all([
      supabase.from('task_templates').update({ sort_order: b }).eq('id', template.id),
      supabase.from('task_templates').update({ sort_order: a }).eq('id', swap.id),
    ]);
  };

  const renderGroup = (groupType: 'internal' | 'garage' | 'external', label: string) => {
    const group = templates
      .filter(t => t.type === groupType)
      .sort((a, b) => a.sort_order - b.sort_order);
    if (group.length === 0) return null;
    return (
      <div key={groupType}>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{label}</h3>
        <div className="border rounded-md divide-y divide-border">
        {group.map((t, idx) => (
          <div
            key={t.id}
            className="flex items-center gap-2 py-2 px-3 hover:bg-muted/50 cursor-pointer text-sm"
            onClick={() => openEdit(t)}
          >
            <div className="flex flex-col gap-0">
              <button
                type="button"
                className="h-3.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                disabled={idx === 0}
                onClick={e => { e.stopPropagation(); move(t, -1); }}
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                type="button"
                className="h-3.5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                disabled={idx === group.length - 1}
                onClick={e => { e.stopPropagation(); move(t, 1); }}
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
            <span className="flex-1 font-medium">{t.name}</span>
            {!t.is_default && (
              <Badge variant="secondary" className="text-xs">Manual</Badge>
            )}
            <button
              type="button"
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={e => { e.stopPropagation(); handleArchive(t.id); }}
              title="Archive"
            >
              <ArchiveIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Default tasks for new plots.
        </p>
        <div className="flex items-center gap-2">
          {archived.length > 0 && (
            <Button
              size="sm"
              variant={showArchived ? 'default' : 'outline'}
              onClick={() => setShowArchived(s => !s)}
            >
              <ArchiveIcon className="mr-2 h-3.5 w-3.5" />
              Archived tasks ({archived.length})
            </Button>
          )}
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />Add template
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : showArchived ? (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Archived Tasks</h3>
          {archived.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No archived tasks</p>
          ) : (
            <div className="border rounded-md divide-y divide-border">
              {archived.map(t => (
                <div key={t.id} className="flex items-center gap-2 py-2 px-3 text-sm text-muted-foreground">
                  <span className="flex-1">{t.name}</span>
                  <Badge variant="secondary" className="text-xs">{t.type}</Badge>
                  <Button variant="outline" size="sm" onClick={() => handleRestore(t.id)}>
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {GROUPS.map(g => renderGroup(g.type, g.label))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit template' : 'Add template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as 'internal' | 'garage' | 'external' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="garage">Garage</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_default"
                checked={form.is_default}
                onCheckedChange={v => setForm(f => ({ ...f, is_default: v === true }))}
              />
              <Label htmlFor="is_default" className="cursor-pointer">
                Auto-add to new plots
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
