import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
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
import { Badge } from '@/components/ui/badge';
import {
  fetchCustomerCareJob,
  fetchDecoratorOptions,
  fetchDeveloperOptions,
  fetchSiteOptionsForDeveloper,
  getCustomerCarePdfSignedUrl,
  updateCustomerCareJob,
  type CustomerCareDefect,
  type CustomerCareJob,
  type JobStatus,
} from '@/api/customer-care';
import {
  DEFECT_CATEGORY_OPTIONS,
  PRIORITY_BADGE_CLASS,
  PRIORITY_OPTIONS,
  STATUS_BADGE_CLASS,
  STATUS_OPTIONS,
  formatUkDate,
  labelFor,
} from './constants';

interface Props {
  jobId: string | null;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function JobDetailDialog({ jobId, onOpenChange, onUpdated }: Props) {
  const [job, setJob] = useState<CustomerCareJob | null>(null);
  const [defects, setDefects] = useState<CustomerCareDefect[]>([]);
  const [decorators, setDecorators] = useState<Array<{ id: string; name: string }>>([]);
  const [developers, setDevelopers] = useState<Array<{ id: string; name: string }>>([]);
  const [sites, setSites] = useState<Array<{ id: string; name: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<JobStatus>('new');
  const [assignedId, setAssignedId] = useState<string | null>(null);
  const [developerId, setDeveloperId] = useState<string | null>(null);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [dateCompleted, setDateCompleted] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (!jobId) return;
    fetchCustomerCareJob(jobId)
      .then(({ job, defects }) => {
        setJob(job);
        setDefects(defects);
        setStatus(job.status);
        setAssignedId(job.assigned_decorator_id);
        setDeveloperId(job.developer_id);
        setSiteId(job.site_id);
        setAppointmentDate(job.appointment_date ?? '');
        setDateCompleted(job.date_completed ?? '');
        setNotes(job.notes ?? '');
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to load job'));
    fetchDecoratorOptions().then(setDecorators).catch(() => setDecorators([]));
    fetchDeveloperOptions().then(setDevelopers).catch(() => setDevelopers([]));
  }, [jobId]);

  useEffect(() => {
    if (!developerId) {
      setSites([]);
      return;
    }
    fetchSiteOptionsForDeveloper(developerId).then(setSites).catch(() => setSites([]));
  }, [developerId]);

  async function handleOpenPdf() {
    if (!job?.attachment_url) return;
    try {
      const url = await getCustomerCarePdfSignedUrl(job.attachment_url);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not open PDF');
    }
  }

  async function handleSave() {
    if (!job) return;
    setSaving(true);
    try {
      await updateCustomerCareJob(job.id, {
        status,
        assigned_decorator_id: assignedId,
        developer_id: developerId,
        site_id: siteId,
        appointment_date: appointmentDate || null,
        date_completed: dateCompleted || null,
        notes: notes || null,
      });
      toast.success('Job updated');
      onUpdated();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!jobId} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {job ? (
              <span className="flex items-center gap-3">
                <span>
                  {job.unit_reference ? `Plot ${job.unit_reference} — ` : ''}
                  {job.homeowner_name ?? 'Customer care job'}
                </span>
                {job.priority && (
                  <Badge variant="outline" className={PRIORITY_BADGE_CLASS[job.priority]}>
                    {labelFor(PRIORITY_OPTIONS, job.priority)}
                  </Badge>
                )}
              </span>
            ) : (
              'Loading…'
            )}
          </DialogTitle>
        </DialogHeader>

        {job && (
          <div className="space-y-6 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={STATUS_BADGE_CLASS[status]}>
                {labelFor(STATUS_OPTIONS, status)}
              </Badge>
              {job.source_format && (
                <Badge variant="outline" className="text-muted-foreground">
                  {job.source_format.replace(/_/g, ' ')}
                </Badge>
              )}
              {job.external_ref && (
                <span className="text-xs text-muted-foreground">Ref {job.external_ref}</span>
              )}
              {job.attachment_url && (
                <Button type="button" variant="outline" size="sm" className="ml-auto" onClick={handleOpenPdf}>
                  <ExternalLink className="h-4 w-4 mr-2" />Original PDF
                </Button>
              )}
            </div>

            <Section title="Property">
              <Info label="Address" value={job.address} className="col-span-2" />
              <Info label="House type" value={job.house_type} />
              <Info label="Plot" value={job.unit_reference} />
            </Section>

            <Section title="Homeowner">
              <Info label="Name" value={job.homeowner_name} />
              <Info label="Phone" value={job.homeowner_phone} />
              <Info label="Email" value={job.homeowner_email} className="col-span-2" />
              {job.contact_notes && (
                <Info label="Notes" value={job.contact_notes} className="col-span-2" />
              )}
            </Section>

            <Section title="Job">
              <Info label="Date received" value={formatUkDate(job.date_received)} />
              <Info label="SLA date" value={formatUkDate(job.sla_date)} />
              <Info label="Raised by" value={job.raised_by} />
            </Section>

            <section className="space-y-2">
              <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Defects ({defects.length})
              </h3>
              {defects.length === 0 && (
                <p className="text-sm text-muted-foreground">No defects recorded.</p>
              )}
              <div className="divide-y divide-border border border-border rounded-md">
                {defects.map((d) => (
                  <div key={d.id} className="p-3 text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{d.location || 'Location not set'}</span>
                      {d.category && (
                        <Badge variant="outline" className="text-xs">
                          {labelFor(DEFECT_CATEGORY_OPTIONS, d.category)}
                        </Badge>
                      )}
                      {d.issue_number && (
                        <span className="text-xs text-muted-foreground ml-auto">#{d.issue_number}</span>
                      )}
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap">{d.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4 border-t border-border pt-5">
              <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Update
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <Field label="Developer">
                  <Select
                    value={developerId ?? ''}
                    onValueChange={(v) => { setDeveloperId(v || null); setSiteId(null); }}
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
                    value={siteId ?? ''}
                    onValueChange={(v) => setSiteId(v || null)}
                    disabled={!developerId}
                  >
                    <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                    <SelectContent>
                      {sites.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Status">
                  <Select value={status} onValueChange={(v) => setStatus(v as JobStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Assigned decorator">
                  <Select value={assignedId ?? ''} onValueChange={(v) => setAssignedId(v || null)}>
                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      {decorators.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Appointment date">
                  <Input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} />
                </Field>
                <Field label="Date completed">
                  <Input type="date" value={dateCompleted} onChange={(e) => setDateCompleted(e.target.value)} />
                </Field>
                <Field label="Notes" className="col-span-2">
                  <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </Field>
              </div>
            </section>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Close</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        {children}
      </div>
    </section>
  );
}

function Info({ label, value, className }: { label: string; value: string | null; className?: string }) {
  return (
    <div className={className}>
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="whitespace-pre-wrap">{value ?? '—'}</div>
    </div>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
