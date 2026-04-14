import type { JobPriority, JobStatus, SourceFormat, DefectCategory } from '@/api/customer-care';

export const STATUS_OPTIONS: Array<{ value: JobStatus; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
];

export const PRIORITY_OPTIONS: Array<{ value: JobPriority; label: string }> = [
  { value: 'urgent', label: 'Urgent' },
  { value: '7_day', label: '7 day' },
  { value: '14_day', label: '14 day' },
  { value: '21_day', label: '21 day' },
  { value: 'routine', label: 'Routine' },
];

export const SOURCE_FORMAT_OPTIONS: Array<{ value: SourceFormat; label: string }> = [
  { value: 'persimmon_warranty', label: 'Persimmon Warranty' },
  { value: 'clixifix', label: 'Clixifix' },
  { value: 'coastline_order', label: 'Coastline Order' },
  { value: 'wain_tasksheet', label: 'Wain Task Sheet' },
  { value: 'other', label: 'Other' },
];

export const DEFECT_CATEGORY_OPTIONS: Array<{ value: DefectCategory; label: string }> = [
  { value: 'paint', label: 'Paint' },
  { value: 'sealant', label: 'Sealant' },
  { value: 'making_good', label: 'Making good' },
  { value: 'other', label: 'Other' },
];

export const PRIORITY_BADGE_CLASS: Record<JobPriority, string> = {
  urgent: 'bg-destructive/20 text-destructive border-destructive/40',
  '7_day': 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  '14_day': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  '21_day': 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  routine: 'bg-muted text-muted-foreground border-border',
};

export const STATUS_BADGE_CLASS: Record<JobStatus, string> = {
  new: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  scheduled: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  completed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
};

export function labelFor<T extends string>(
  options: ReadonlyArray<{ value: T; label: string }>,
  value: T | null | undefined,
): string {
  if (!value) return '—';
  return options.find((o) => o.value === value)?.label ?? value;
}

export function formatUkDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}
