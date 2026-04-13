import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertTriangle, Clock, CheckSquare, ClipboardCheck, FileText,
  Filter, RefreshCw, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type FormType = 'Issue Report' | 'Hourly Agreement' | 'Sign Off' | 'Quality Report' | 'Invoice';

interface FeedItem {
  id: string;
  form_type: FormType;
  submitted_by: string;
  site_name: string | null;
  plot_name: string | null;
  created_at: string;
  status: string | null;
  source_table: string;
}

interface Site {
  id: string;
  name: string;
  developer_id: string;
}

interface Developer {
  id: string;
  name: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const FORM_TYPE_CONFIG: Record<FormType, { icon: React.ElementType; colour: string }> = {
  'Issue Report':      { icon: AlertTriangle,  colour: 'text-red-400' },
  'Hourly Agreement':  { icon: Clock,          colour: 'text-amber-400' },
  'Sign Off':          { icon: CheckSquare,    colour: 'text-green-400' },
  'Quality Report':    { icon: ClipboardCheck, colour: 'text-blue-400' },
  'Invoice':           { icon: FileText,       colour: 'text-purple-400' },
};

function statusBadge(status: string | null) {
  if (!status) return null;
  const lower = status.toLowerCase();
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
  let className = '';
  if (lower === 'pending' || lower === 'submitted') {
    variant = 'outline';
    className = 'border-amber-500/50 text-amber-400';
  } else if (lower === 'approved' || lower === 'completed' || lower === 'paid') {
    variant = 'outline';
    className = 'border-green-500/50 text-green-400';
  } else if (lower === 'flagged' || lower === 'rejected') {
    variant = 'destructive';
  }
  return (
    <Badge variant={variant} className={className}>
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/*  Data fetching                                                      */
/* ------------------------------------------------------------------ */

interface RawRow {
  id: string;
  user_id: string;
  site_name?: string | null;
  plot_name?: string | null;
  status?: string | null;
  created_at: string;
}

const TABLE_CONFIG: { table: string; formType: FormType; select: string; hasStatus: boolean; hasSite: boolean }[] = [
  { table: 'sign_offs',         formType: 'Sign Off',         select: 'id, user_id, site_id, site_name, plot_name, created_at',         hasStatus: false, hasSite: true },
  { table: 'hourly_agreements', formType: 'Hourly Agreement',  select: 'id, user_id, site_id, site_name, plot_name, created_at',         hasStatus: false, hasSite: true },
  { table: 'invoices',          formType: 'Invoice',           select: 'id, user_id, status, created_at',                                hasStatus: true,  hasSite: false },
  { table: 'issue_reports',     formType: 'Issue Report',      select: 'id, user_id, site_id, site_name, plot_name, status, created_at', hasStatus: true,  hasSite: true },
  { table: 'quality_reports',   formType: 'Quality Report',    select: 'id, user_id, site_id, site_name, plot_name, status, created_at', hasStatus: true,  hasSite: true },
];

async function fetchFeed(filters: {
  formType: string;
  siteId: string;
}): Promise<FeedItem[]> {
  // Pick which tables to query
  const tables = filters.formType === 'all'
    ? TABLE_CONFIG
    : TABLE_CONFIG.filter(t => t.formType === filters.formType);

  // Query each table in parallel — allSettled so missing tables don't break the feed
  const results = await Promise.allSettled(
    tables.map(async (cfg) => {
      let query = supabase
        .from(cfg.table)
        .select(cfg.select)
        .order('created_at', { ascending: false });

      if (filters.siteId !== 'all' && cfg.hasSite) {
        query = query.eq('site_id', filters.siteId);
      }

      const { data, error } = await query;
      if (error) throw new Error(`${cfg.table}: ${error.message}`);
      return { cfg, rows: (data || []) as RawRow[] };
    }),
  );

  // Collect raw rows + gather unique user_ids
  const rawItems: { cfg: typeof TABLE_CONFIG[number]; row: RawRow }[] = [];
  const userIds = new Set<string>();

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;
    for (const row of result.value.rows) {
      rawItems.push({ cfg: result.value.cfg, row });
      if (row.user_id) userIds.add(row.user_id);
    }
  }

  // Batch-resolve user names from profiles
  const nameMap = new Map<string, string>();
  if (userIds.size > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name')
      .in('user_id', [...userIds]);
    for (const p of (profiles || []) as { user_id: string; first_name: string | null; last_name: string | null }[]) {
      const name = [p.first_name, p.last_name].filter(Boolean).join(' ');
      nameMap.set(p.user_id, name || 'Unknown');
    }
  }

  // Build feed items
  const items: FeedItem[] = rawItems.map(({ cfg, row }) => ({
    id: row.id,
    form_type: cfg.formType,
    submitted_by: nameMap.get(row.user_id) || 'Unknown',
    site_name: row.site_name || null,
    plot_name: row.plot_name || null,
    created_at: row.created_at,
    status: cfg.hasStatus ? (row.status || null) : null,
    source_table: cfg.table,
  }));

  // Sort newest first
  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return items;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ActivityFeed() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formTypeFilter, setFormTypeFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [developerFilter, setDeveloperFilter] = useState('all');
  const [sites, setSites] = useState<Site[]>([]);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FeedItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load filter options
  useEffect(() => {
    (async () => {
      const [siteRes, devRes] = await Promise.all([
        supabase.from('sites').select('id, name, developer_id').eq('status', 'active').order('name'),
        supabase.from('developers').select('id, name').eq('is_archived', false).order('name'),
      ]);
      if (siteRes.data) setSites(siteRes.data as Site[]);
      if (devRes.data) setDevelopers(devRes.data as Developer[]);
    })();
  }, []);

  // Filtered sites based on developer selection
  const filteredSites = developerFilter === 'all'
    ? sites
    : sites.filter(s => s.developer_id === developerFilter);

  // Reset site filter when developer changes and selected site isn't in new list
  useEffect(() => {
    if (siteFilter !== 'all' && !filteredSites.find(s => s.id === siteFilter)) {
      setSiteFilter('all');
    }
  }, [developerFilter, filteredSites, siteFilter]);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFeed({
        formType: formTypeFilter,
        siteId: siteFilter,
      });
      setItems(data);
    } catch {
      toast.error('Failed to load activity feed');
    }
    setLoading(false);
  }, [formTypeFilter, siteFilter]);

  // Initial load + reload on filter change
  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Realtime subscriptions for all five tables
  useEffect(() => {
    const tables = ['sign_offs', 'hourly_agreements', 'invoices', 'issue_reports', 'quality_reports'];
    const channel = supabase.channel('activity-feed');

    for (const table of tables) {
      channel.on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table,
      }, () => {
        loadFeed();
      });
      channel.on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table,
      }, () => {
        loadFeed();
      });
    }

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadFeed]);

  const handleRowClick = (item: FeedItem) => {
    navigate('/users');
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    const { error } = await supabase
      .from(confirmDelete.source_table)
      .delete()
      .eq('id', confirmDelete.id);
    setDeleting(false);
    if (error) {
      toast.error('Failed to delete: ' + error.message);
      return;
    }
    toast.success(`${confirmDelete.form_type} deleted`);
    setConfirmDelete(null);
    setItems(prev => prev.filter(i => !(i.source_table === confirmDelete.source_table && i.id === confirmDelete.id)));
  };

  return (
    <div className="border rounded-lg bg-card">
      {/* Header */}
      <div className="px-5 py-3 border-b border-border/60 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent Submissions
          </h2>
          {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />

          <Select value={formTypeFilter} onValueChange={setFormTypeFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="Issue Report">Issue Reports</SelectItem>
              <SelectItem value="Hourly Agreement">Hourly Agreements</SelectItem>
              <SelectItem value="Sign Off">Sign Offs</SelectItem>
              <SelectItem value="Quality Report">Quality Reports</SelectItem>
              <SelectItem value="Invoice">Invoices</SelectItem>
            </SelectContent>
          </Select>

          <Select value={developerFilter} onValueChange={setDeveloperFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue placeholder="All developers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All developers</SelectItem>
              {developers.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={siteFilter} onValueChange={setSiteFilter}>
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue placeholder="All sites" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sites</SelectItem>
              {filteredSites.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Feed list */}
      <div className="divide-y divide-border">
        {!loading && items.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No submissions found
          </div>
        )}
        {items.map((item) => {
          const config = FORM_TYPE_CONFIG[item.form_type];
          const Icon = config.icon;
          const isPending = item.status && ['pending', 'submitted'].includes(item.status.toLowerCase());

          return (
            <div
              key={`${item.source_table}-${item.id}`}
              className={`flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                isPending ? 'border-l-2 border-l-amber-500' : ''
              }`}
              onClick={() => handleRowClick(item)}
            >
              {/* Icon */}
              <div className={`shrink-0 ${config.colour}`}>
                <Icon className="h-4 w-4" />
              </div>

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {item.form_type}
                  </span>
                  {statusBadge(item.status)}
                </div>
                <p className="text-sm mt-0.5 truncate">
                  <span className="font-medium">{item.submitted_by}</span>
                  {item.site_name && (
                    <span className="text-muted-foreground">
                      {' — '}{item.site_name}
                      {item.plot_name && `, ${item.plot_name}`}
                    </span>
                  )}
                </p>
              </div>

              {/* Timestamp + delete */}
              <div className="shrink-0 text-xs text-muted-foreground">
                {timeAgo(item.created_at)}
              </div>
              <button
                className="shrink-0 p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
                title="Delete submission"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(item);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={open => { if (!open) setConfirmDelete(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Submission</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Permanently delete this <span className="font-medium text-foreground">{confirmDelete?.form_type}</span> from{' '}
            <span className="font-medium text-foreground">{confirmDelete?.submitted_by}</span>
            {confirmDelete?.site_name && <> at <span className="font-medium text-foreground">{confirmDelete.site_name}</span></>}
            ? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
