import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

export interface FieldConfig {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'select';
  options?: { value: string; label: string }[];
  required?: boolean;
  /** For select fields that reference another table */
  foreignTable?: string;
  foreignLabel?: string;
  /** Width class */
  width?: string;
}

interface EntityPageProps {
  title: string;
  table: string;
  fields: FieldConfig[];
  defaultValues?: Record<string, any>;
  /** Format display values */
  formatCell?: (key: string, value: any, row: any) => React.ReactNode;
}

export function EntityPage({ title, table, fields, defaultValues = {}, formatCell }: EntityPageProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterField, setFilterField] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [foreignData, setForeignData] = useState<Record<string, any[]>>({});

  // Load foreign table data for select fields
  useEffect(() => {
    const foreignFields = fields.filter(f => f.foreignTable);
    foreignFields.forEach(async (f) => {
      const { data } = await supabase.from(f.foreignTable!).select('*');
      if (data) setForeignData(prev => ({ ...prev, [f.key]: data }));
    });
  }, [fields]);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
    if (error) {
      toast.error('Failed to load data: ' + error.message);
    } else {
      setData(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [table]);

  const filteredData = useMemo(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(row =>
        fields.some(f => String(row[f.key] ?? '').toLowerCase().includes(q))
      );
    }
    if (filterField && filterValue) {
      result = result.filter(row => String(row[filterField]) === filterValue);
    }
    return result;
  }, [data, search, filterField, filterValue, fields]);

  const selectFields = fields.filter(f => f.type === 'select' && f.options);

  const openCreate = () => {
    setEditingRecord(null);
    setFormData({ ...defaultValues });
    setDialogOpen(true);
  };

  const openEdit = (record: any) => {
    setEditingRecord(record);
    const fd: Record<string, any> = {};
    fields.forEach(f => { fd[f.key] = record[f.key] ?? ''; });
    setFormData(fd);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    if (editingRecord) {
      const { error } = await supabase.from(table).update(formData).eq('id', editingRecord.id);
      if (error) toast.error('Update failed: ' + error.message);
      else { toast.success('Record updated'); setDialogOpen(false); fetchData(); }
    } else {
      const { error } = await supabase.from(table).insert(formData);
      if (error) toast.error('Create failed: ' + error.message);
      else { toast.success('Record created'); setDialogOpen(false); fetchData(); }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from(table).delete().eq('id', deleteId);
    if (error) toast.error('Delete failed: ' + error.message);
    else { toast.success('Record deleted'); fetchData(); }
    setDeleteId(null);
  };

  const getForeignLabel = (field: FieldConfig, value: any) => {
    if (!field.foreignTable || !foreignData[field.key]) return value;
    const record = foreignData[field.key].find((r: any) => r.id === value);
    return record ? record[field.foreignLabel || 'name'] : value;
  };

  const renderField = (field: FieldConfig) => {
    if (field.type === 'select' && field.foreignTable) {
      const items = foreignData[field.key] || [];
      return (
        <Select value={formData[field.key] || ''} onValueChange={v => setFormData(p => ({ ...p, [field.key]: v }))}>
          <SelectTrigger><SelectValue placeholder={`Select ${field.label}`} /></SelectTrigger>
          <SelectContent>
            {items.map((item: any) => (
              <SelectItem key={item.id} value={item.id}>{item[field.foreignLabel || 'name']}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    if (field.type === 'select' && field.options) {
      return (
        <Select value={formData[field.key] || ''} onValueChange={v => setFormData(p => ({ ...p, [field.key]: v }))}>
          <SelectTrigger><SelectValue placeholder={`Select ${field.label}`} /></SelectTrigger>
          <SelectContent>
            {field.options.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return (
      <Input
        type={field.type || 'text'}
        value={formData[field.key] || ''}
        onChange={e => setFormData(p => ({ ...p, [field.key]: field.type === 'number' ? parseFloat(e.target.value) || '' : e.target.value }))}
        required={field.required}
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add {title.replace(/s$/, '')}</Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        {selectFields.map(f => (
          <Select key={f.key} value={filterField === f.key ? filterValue : ''} onValueChange={v => { setFilterField(f.key); setFilterValue(v === '__all__' ? '' : v); if (v === '__all__') setFilterField(''); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder={f.label} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              {f.options?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        ))}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {fields.map(f => (
                <TableHead key={f.key} className={f.width}>{f.label}</TableHead>
              ))}
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={fields.length + 1} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow><TableCell colSpan={fields.length + 1} className="text-center py-8 text-muted-foreground">No records found</TableCell></TableRow>
            ) : (
              filteredData.map(row => (
                <TableRow key={row.id} className="hover:bg-muted/30">
                  {fields.map(f => (
                    <TableCell key={f.key}>
                      {formatCell ? formatCell(f.key, row[f.key], row) ??
                        (f.foreignTable ? getForeignLabel(f, row[f.key]) :
                        f.type === 'select' && f.options ? f.options.find(o => o.value === row[f.key])?.label ?? row[f.key] :
                        f.type === 'number' && f.key === 'price' ? `£${Number(row[f.key]).toFixed(2)}` :
                        row[f.key]) :
                        (f.foreignTable ? getForeignLabel(f, row[f.key]) :
                        f.type === 'select' && f.options ? f.options.find(o => o.value === row[f.key])?.label ?? row[f.key] :
                        f.type === 'number' && f.key === 'price' ? `£${Number(row[f.key]).toFixed(2)}` :
                        row[f.key])}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Edit' : 'Create'} {title.replace(/s$/, '')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {fields.map(f => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                {renderField(f)}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} />
    </div>
  );
}
