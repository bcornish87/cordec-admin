import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  createCustomerCareJob,
  extractCustomerCarePdf,
  fetchDeveloperOptions,
  fetchSiteOptionsForDeveloper,
  uploadCustomerCarePdf,
  type DefectCategory,
  type ExtractedJob,
  type JobPriority,
  type SourceFormat,
} from '@/api/customer-care';
import {
  DEFECT_CATEGORY_OPTIONS,
  PRIORITY_OPTIONS,
  SOURCE_FORMAT_OPTIONS,
} from './constants';

type Stage = 'extracting' | 'review';

interface ReviewForm {
  developer_id: string | null;
  site_id: string | null;
  unit_reference: string;
  address: string;
  house_type: string;
  homeowner_name: string;
  homeowner_phone: string;
  homeowner_email: string;
  contact_notes: string;
  external_ref: string;
  source_format: SourceFormat;
  date_received: string;
  sla_date: string;
  priority: JobPriority | '';
  raised_by: string;
  defects: Array<{
    location: string;
    category: DefectCategory | '';
    description: string;
    issue_number: string;
  }>;
}

const EMPTY_DEFECT = { location: '', category: '' as const, description: '', issue_number: '' };

function extractedToForm(ex: ExtractedJob): ReviewForm {
  return {
    developer_id: ex.suggested_developer_id,
    site_id: ex.suggested_site_id,
    unit_reference: ex.unit_reference ?? '',
    address: ex.address ?? '',
    house_type: ex.house_type ?? '',
    homeowner_name: ex.homeowner_name ?? '',
    homeowner_phone: ex.homeowner_phone ?? '',
    homeowner_email: ex.homeowner_email ?? '',
    contact_notes: ex.contact_notes ?? '',
    external_ref: ex.external_ref ?? '',
    source_format: ex.source_format ?? 'other',
    date_received: ex.date_received ?? '',
    sla_date: ex.sla_date ?? '',
    priority: ex.priority ?? '',
    raised_by: ex.raised_by ?? '',
    defects:
      ex.defects && ex.defects.length > 0
        ? ex.defects.map((d) => ({
            location: d.location ?? '',
            category: d.category ?? '',
            description: d.description ?? '',
            issue_number: d.issue_number ?? '',
          }))
        : [{ ...EMPTY_DEFECT }],
  };
}

interface Props {
  file: File | null;
  onClose: () => void;
  onCreated: () => void;
}

export function UploadDialog({ file, onClose, onCreated }: Props) {
  const [stage, setStage] = useState<Stage>('extracting');
  const [attachmentPath, setAttachmentPath] = useState<string | null>(null);
  const [form, setForm] = useState<ReviewForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [developers, setDevelopers] = useState<Array<{ id: string; name: string }>>([]);
  const [sites, setSites] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (!file) return;
    setStage('extracting');
    setAttachmentPath(null);
    setForm(null);
    fetchDeveloperOptions().then(setDevelopers).catch(() => setDevelopers([]));

    let cancelled = false;
    (async () => {
      try {
        const path = await uploadCustomerCarePdf(file);
        if (cancelled) return;
        setAttachmentPath(path);
        const extracted = await extractCustomerCarePdf(path);
        if (cancelled) return;
        setForm(extractedToForm(extracted));
        setStage('review');
      } catch (err) {
        if (cancelled) return;
        toast.error(err instanceof Error ? err.message : 'Extraction failed');
        onClose();
      }
    })();
    return () => { cancelled = true; };
  }, [file, onClose]);

  useEffect(() => {
    if (!form?.developer_id) {
      setSites([]);
      return;
    }
    fetchSiteOptionsForDeveloper(form.developer_id).then(setSites).catch(() => setSites([]));
  }, [form?.developer_id]);

  function updateForm<K extends keyof ReviewForm>(key: K, value: ReviewForm[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function updateDefect(index: number, patch: Partial<ReviewForm['defects'][number]>) {
    setForm((prev) => {
      if (!prev) return prev;
      const defects = prev.defects.map((d, i) => (i === index ? { ...d, ...patch } : d));
      return { ...prev, defects };
    });
  }

  function addDefect() {
    setForm((prev) => (prev ? { ...prev, defects: [...prev.defects, { ...EMPTY_DEFECT }] } : prev));
  }

  function removeDefect(index: number) {
    setForm((prev) => {
      if (!prev) return prev;
      if (prev.defects.length === 1) return prev;
      return { ...prev, defects: prev.defects.filter((_, i) => i !== index) };
    });
  }

  async function handleSave() {
    if (!form || !attachmentPath) return;
    setSaving(true);
    try {
      await createCustomerCareJob({
        job: {
          developer_id: form.developer_id,
          site_id: form.site_id,
          unit_reference: form.unit_reference || null,
          address: form.address || null,
          house_type: form.house_type || null,
          homeowner_name: form.homeowner_name || null,
          homeowner_phone: form.homeowner_phone || null,
          homeowner_email: form.homeowner_email || null,
          contact_notes: form.contact_notes || null,
          external_ref: form.external_ref || null,
          source_format: form.source_format,
          date_received: form.date_received || null,
          sla_date: form.sla_date || null,
          priority: form.priority || null,
          raised_by: form.raised_by || null,
          assigned_decorator_id: null,
          appointment_date: null,
          date_completed: null,
          notes: null,
          attachment_url: attachmentPath,
          status: 'new',
        },
        defects: form.defects
          .filter((d) => d.description || d.location)
          .map((d) => ({
            location: d.location || null,
            category: d.category || null,
            description: d.description || null,
            issue_number: d.issue_number || null,
          })),
      });
      toast.success('Customer care job created');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!file} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New customer care job</DialogTitle>
          <DialogDescription>
            {file?.name ?? 'Reviewing extracted fields'}
          </DialogDescription>
        </DialogHeader>

        {stage === 'extracting' && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Extracting fields from PDF…</p>
          </div>
        )}

        {stage === 'review' && form && (
          <div className="space-y-5 py-2">
            <section className="grid grid-cols-2 gap-3">
              <Field label="Developer">
                <Select
                  value={form.developer_id ?? ''}
                  onValueChange={(v) => updateForm('developer_id', v || null)}
                >
                  <SelectTrigger><SelectValue placeholder="Select developer" /></SelectTrigger>
                  <SelectContent>
                    {developers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Site">
                <Select
                  value={form.site_id ?? ''}
                  onValueChange={(v) => updateForm('site_id', v || null)}
                  disabled={!form.developer_id}
                >
                  <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                  <SelectContent>
                    {sites.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Unit / Plot">
                <Input value={form.unit_reference} onChange={(e) => updateForm('unit_reference', e.target.value)} />
              </Field>
              <Field label="House type">
                <Input value={form.house_type} onChange={(e) => updateForm('house_type', e.target.value)} />
              </Field>
              <Field label="Address" className="col-span-2">
                <Input value={form.address} onChange={(e) => updateForm('address', e.target.value)} />
              </Field>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <Field label="Homeowner name">
                <Input value={form.homeowner_name} onChange={(e) => updateForm('homeowner_name', e.target.value)} />
              </Field>
              <Field label="Phone">
                <Input value={form.homeowner_phone} onChange={(e) => updateForm('homeowner_phone', e.target.value)} />
              </Field>
              <Field label="Email" className="col-span-2">
                <Input value={form.homeowner_email} onChange={(e) => updateForm('homeowner_email', e.target.value)} />
              </Field>
              <Field label="Contact notes" className="col-span-2">
                <Textarea rows={2} value={form.contact_notes} onChange={(e) => updateForm('contact_notes', e.target.value)} />
              </Field>
            </section>

            <section className="grid grid-cols-2 gap-3">
              <Field label="External ref">
                <Input value={form.external_ref} onChange={(e) => updateForm('external_ref', e.target.value)} />
              </Field>
              <Field label="Source format">
                <Select value={form.source_format} onValueChange={(v) => updateForm('source_format', v as SourceFormat)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCE_FORMAT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Date received">
                <Input type="date" value={form.date_received} onChange={(e) => updateForm('date_received', e.target.value)} />
              </Field>
              <Field label="SLA date">
                <Input type="date" value={form.sla_date} onChange={(e) => updateForm('sla_date', e.target.value)} />
              </Field>
              <Field label="Priority">
                <Select value={form.priority || ''} onValueChange={(v) => updateForm('priority', (v || '') as JobPriority | '')}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Raised by">
                <Input value={form.raised_by} onChange={(e) => updateForm('raised_by', e.target.value)} />
              </Field>
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Defects</h3>
                <Button type="button" size="sm" variant="outline" onClick={addDefect}>Add defect</Button>
              </div>
              {form.defects.map((d, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start border border-border rounded-md p-3">
                  <div className="col-span-3">
                    <Label className="text-xs text-muted-foreground">Location</Label>
                    <Input value={d.location} onChange={(e) => updateDefect(i, { location: e.target.value })} />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs text-muted-foreground">Category</Label>
                    <Select
                      value={d.category || ''}
                      onValueChange={(v) => updateDefect(i, { category: (v || '') as DefectCategory | '' })}
                    >
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>
                        {DEFECT_CATEGORY_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Issue #</Label>
                    <Input value={d.issue_number} onChange={(e) => updateDefect(i, { issue_number: e.target.value })} />
                  </div>
                  <div className="col-span-4">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <Textarea rows={2} value={d.description} onChange={(e) => updateDefect(i, { description: e.target.value })} />
                  </div>
                  {form.defects.length > 1 && (
                    <div className="col-span-12 text-right">
                      <Button type="button" size="sm" variant="ghost" onClick={() => removeDefect(i)}>Remove</Button>
                    </div>
                  )}
                </div>
              ))}
            </section>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save job'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1 ${className ?? ''}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
