import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ExternalLink, Plus, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  deleteCustomerCareJob,
  fetchCustomerCareJobs,
  fetchDeveloperOptions,
  getCustomerCarePdfSignedUrl,
  updateCustomerCareJob,
  type CustomerCareJobRow,
  type JobStatus,
} from '@/api/customer-care';
import {
  STATUS_BADGE_CLASS,
  STATUS_OPTIONS,
  formatUkDate,
} from './customer-care/constants';
import { UploadDialog } from './customer-care/UploadDialog';
import { JobDetailDialog } from './customer-care/JobDetailDialog';

const ALL = '__all__';

export default function CustomerCare() {
  const [jobs, setJobs] = useState<CustomerCareJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<JobStatus | ''>('');
  const [developerFilter, setDeveloperFilter] = useState<string>('');
  const [developers, setDevelopers] = useState<Array<{ id: string; name: string }>>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [deleteJob, setDeleteJob] = useState<CustomerCareJobRow | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCustomerCareJobs({
        status: statusFilter || null,
        developerId: developerFilter || null,
      });
      setJobs(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, developerFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchDeveloperOptions().then(setDevelopers).catch(() => setDevelopers([]));
  }, []);

  const stats = useMemo(() => {
    const open = jobs.filter((j) => j.status !== 'completed').length;
    const overdue = jobs.filter((j) => {
      if (j.status === 'completed' || !j.date_received) return false;
      const days = Math.floor((Date.now() - new Date(j.date_received).getTime()) / 86400000);
      return days > 21;
    }).length;
    return { total: jobs.length, open, overdue };
  }, [jobs]);

  const sortedJobs = useMemo(() => {
    return [...jobs].sort((a, b) => {
      const ta = a.date_received ? new Date(a.date_received).getTime() : Infinity;
      const tb = b.date_received ? new Date(b.date_received).getTime() : Infinity;
      return ta - tb;
    });
  }, [jobs]);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <h1 className="text-2xl font-semibold">Customer Care</h1>
        <Button onClick={() => fileInputRef.current?.click()}>
          <Plus className="h-4 w-4 mr-2" />New job
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setPendingFile(f);
            e.target.value = '';
          }}
        />
      </header>

      <div className="flex gap-6 text-sm">
        <Stat label="Total" value={stats.total} />
        <Stat label="Open" value={stats.open} />
        <Stat label="Overdue" value={stats.overdue} tone={stats.overdue > 0 ? 'destructive' : 'default'} />
      </div>

      <div className="flex gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Status</label>
          <Select
            value={statusFilter || ALL}
            onValueChange={(v) => setStatusFilter(v === ALL ? '' : (v as JobStatus))}
          >
            <SelectTrigger className="w-48"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Developer</label>
          <Select
            value={developerFilter || ALL}
            onValueChange={(v) => setDeveloperFilter(v === ALL ? '' : v)}
          >
            <SelectTrigger className="w-64"><SelectValue placeholder="All" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All developers</SelectItem>
              {developers.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border border-border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Task #</TableHead>
              <TableHead className="text-center">Developer</TableHead>
              <TableHead className="text-center">Site</TableHead>
              <TableHead className="text-center">Received</TableHead>
              <TableHead className="text-center">Days open</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!loading && sortedJobs.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No jobs yet. Click "New job" to upload your first PDF.
                </TableCell>
              </TableRow>
            )}
            {!loading && sortedJobs.map((j) => (
              <TableRow
                key={j.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedJobId(j.id)}
              >
                <TableCell className="text-center">{j.external_ref ?? '—'}</TableCell>
                <TableCell className="text-center">{j.developer_name ?? '—'}</TableCell>
                <TableCell className="text-center">{j.site_name ?? '—'}</TableCell>
                <TableCell className="text-center">{formatUkDate(j.date_received)}</TableCell>
                <TableCell className="text-center">
                  <DaysOpenCell received={j.date_received} status={j.status} />
                </TableCell>
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  <StatusSelect
                    value={j.status}
                    onChange={async (next) => {
                      try {
                        await updateCustomerCareJob(j.id, { status: next });
                        load();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Update failed');
                      }
                    }}
                  />
                </TableCell>
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      disabled={!j.attachment_url}
                      onClick={async () => {
                        if (!j.attachment_url) return;
                        try {
                          const url = await getCustomerCarePdfSignedUrl(j.attachment_url);
                          window.open(url, '_blank', 'noopener,noreferrer');
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Could not open PDF');
                        }
                      }}
                      aria-label="Open original PDF"
                      title="Open original PDF"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteJob(j)}
                      aria-label="Delete job"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UploadDialog file={pendingFile} onClose={() => setPendingFile(null)} onCreated={load} />
      <JobDetailDialog
        jobId={selectedJobId}
        onOpenChange={(o) => !o && setSelectedJobId(null)}
        onUpdated={load}
      />

      <AlertDialog
        open={!!deleteJob}
        onOpenChange={(o) => {
          if (!o) {
            setDeleteJob(null);
            setDeleteConfirm('');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteJob && (
                <>
                  {deleteJob.developer_name ?? 'Unknown developer'} —{' '}
                  {deleteJob.homeowner_name ?? deleteJob.unit_reference ?? 'unnamed'}.
                  This will remove the job and all its defects. The PDF stays in storage.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="delete-confirm" className="text-sm">
              Type <span className="font-mono font-semibold text-destructive">DELETE</span> to confirm
            </Label>
            <Input
              id="delete-confirm"
              autoFocus
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirm !== 'DELETE'}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:pointer-events-none"
              onClick={async () => {
                if (!deleteJob || deleteConfirm !== 'DELETE') return;
                try {
                  await deleteCustomerCareJob(deleteJob.id);
                  setDeleteJob(null);
                  setDeleteConfirm('');
                  load();
                  toast.success('Job deleted');
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Delete failed');
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'destructive' }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold ${tone === 'destructive' ? 'text-destructive' : ''}`}>
        {value}
      </div>
    </div>
  );
}

function StatusSelect({ value, onChange }: { value: JobStatus; onChange: (v: JobStatus) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as JobStatus)}>
      <SelectTrigger
        className={`h-8 w-36 mx-auto text-xs font-medium ${STATUS_BADGE_CLASS[value]}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function DaysOpenCell({ received, status }: { received: string | null; status: JobStatus }) {
  if (!received) return <span className="text-muted-foreground">—</span>;
  const closed = status === 'completed';
  const days = Math.floor((Date.now() - new Date(received).getTime()) / 86400000);
  const tone = closed
    ? ''
    : days > 21
      ? 'text-destructive font-medium'
      : days > 14
        ? 'text-orange-400 font-medium'
        : '';
  return <span className={tone}>{days}</span>;
}

