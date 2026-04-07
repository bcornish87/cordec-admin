import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Plot {
  id: string;
  plot_name: string;
  house_type: string | null;
  status: string;
}

interface Template {
  id: string;
  name: string;
  type: 'internal' | 'external';
  sort_order: number;
}

interface PlotTaskRow {
  id: string;
  plot_id: string;
  task_template_id: string | null;
  name: string;
  type: 'internal' | 'external';
  sort_order: number;
  price: number | null;
}

const cellKey = (plotId: string, templateId: string) => `${plotId}:${templateId}`;

function colorFor(value: number, min: number, max: number): string | undefined {
  if (!Number.isFinite(value)) return undefined;
  if (max === min) return 'hsl(120, 60%, 88%)';
  const t = (value - min) / (max - min);
  // 120 = green, 60 = yellow/orange, 0 = red
  const hue = 120 - t * 120;
  return `hsl(${hue}, 70%, 85%)`;
}

function parsePastedGrid(text: string): string[][] {
  const trimmed = text.replace(/\r\n?/g, '\n').replace(/\n+$/, '');
  if (!trimmed) return [];
  return trimmed.split('\n').map(r => r.split('\t'));
}

interface Props {
  siteId: string;
  onOpenPlot: (plot: { id: string; plot_name: string }) => void;
}

export function PlotPriceGrid({ siteId, onOpenPlot }: Props) {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tasks, setTasks] = useState<PlotTaskRow[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [taskIds, setTaskIds] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newPlotName, setNewPlotName] = useState('');

  // Refs that always hold the latest snapshot of the state we read inside async work.
  // Closures captured by handlers see the snapshot from the render they were created in,
  // which causes paste/blur saves to use stale taskIds/tasks. Refs sidestep that.
  const plotsRef = useRef<Plot[]>([]);
  const templatesRef = useRef<Template[]>([]);
  const tasksRef = useRef<PlotTaskRow[]>([]);
  const taskIdsRef = useRef<Record<string, string>>({});
  const valuesRef = useRef<Record<string, string>>({});
  useEffect(() => { plotsRef.current = plots; }, [plots]);
  useEffect(() => { templatesRef.current = templates; }, [templates]);
  useEffect(() => { tasksRef.current = tasks; }, [tasks]);
  useEffect(() => { taskIdsRef.current = taskIds; }, [taskIds]);
  useEffect(() => { valuesRef.current = values; }, [values]);

  // Coordinates of the cell whose input is currently focused. Updated on focus.
  // Used as the paste anchor so paste works even if the focus target is awkward.
  const focusedCellRef = useRef<{ plotIdx: number; tplIdx: number } | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const [plotsRes, tplRes] = await Promise.all([
      supabase.from('plots').select('*').eq('site_id', siteId),
      supabase
        .from('task_templates')
        .select('*')
        .order('type', { ascending: true })
        .order('sort_order', { ascending: true }),
    ]);
    if (plotsRes.error) {
      toast.error('Plots load failed: ' + plotsRes.error.message);
      setLoading(false);
      return;
    }
    if (tplRes.error) {
      toast.error('Templates load failed: ' + tplRes.error.message);
      setLoading(false);
      return;
    }
    const plotList = ((plotsRes.data || []) as Plot[]).slice();
    plotList.sort((a, b) =>
      a.plot_name.localeCompare(b.plot_name, undefined, { numeric: true, sensitivity: 'base' })
    );
    setPlots(plotList);
    setTemplates((tplRes.data || []) as Template[]);

    if (plotList.length > 0) {
      const ids = plotList.map(p => p.id);
      const { data: taskData, error: taskErr } = await supabase
        .from('plot_tasks')
        .select('*')
        .in('plot_id', ids);
      if (taskErr) {
        toast.error('Tasks load failed: ' + taskErr.message);
        setLoading(false);
        return;
      }
      const t = (taskData || []) as PlotTaskRow[];
      setTasks(t);
      const v: Record<string, string> = {};
      const idMap: Record<string, string> = {};
      for (const task of t) {
        if (task.task_template_id) {
          const k = cellKey(task.plot_id, task.task_template_id);
          idMap[k] = task.id;
          if (task.price != null) v[k] = String(task.price);
        }
      }
      setValues(v);
      setTaskIds(idMap);
    } else {
      setTasks([]);
      setValues({});
      setTaskIds({});
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  // Per-column min/max for the heatmap
  const columnStats = useMemo(() => {
    const stats: Record<string, { min: number; max: number }> = {};
    for (const tpl of templates) {
      const nums: number[] = [];
      for (const p of plots) {
        const v = values[cellKey(p.id, tpl.id)];
        if (v != null && v !== '') {
          const n = parseFloat(v);
          if (Number.isFinite(n)) nums.push(n);
        }
      }
      if (nums.length > 0) {
        stats[tpl.id] = { min: Math.min(...nums), max: Math.max(...nums) };
      }
    }
    return stats;
  }, [templates, plots, values]);

  // Persist a single cell. Reads taskIds/tasks from refs so sequential awaits see fresh data
  // (e.g. after a previous insert during the same paste batch).
  const persistCell = async (plotId: string, template: Template, rawValue: string) => {
    const key = cellKey(plotId, template.id);
    const trimmed = rawValue.trim();
    const numeric = trimmed === '' ? null : parseFloat(trimmed);
    if (trimmed !== '' && !Number.isFinite(numeric)) {
      toast.error(`"${trimmed}" is not a valid number`);
      return;
    }
    const existingId = taskIdsRef.current[key];
    if (existingId) {
      const { error } = await supabase
        .from('plot_tasks')
        .update({ price: numeric })
        .eq('id', existingId);
      if (error) toast.error('Save failed: ' + error.message);
      return;
    }
    const sameType = tasksRef.current.filter(
      t => t.plot_id === plotId && t.type === template.type
    );
    const nextOrder =
      sameType.length > 0
        ? Math.max(...sameType.map(t => t.sort_order)) + 1
        : template.sort_order;
    const { data, error } = await supabase
      .from('plot_tasks')
      .insert({
        plot_id: plotId,
        task_template_id: template.id,
        name: template.name,
        type: template.type,
        sort_order: nextOrder,
        price: numeric,
      })
      .select()
      .single();
    if (error) {
      toast.error('Save failed: ' + error.message);
      return;
    }
    if (data) {
      const row = data as PlotTaskRow;
      // Update refs synchronously so the next sequential persistCell sees the new id.
      taskIdsRef.current = { ...taskIdsRef.current, [key]: row.id };
      tasksRef.current = [...tasksRef.current, row];
      setTaskIds(taskIdsRef.current);
      setTasks(tasksRef.current);
    }
  };

  const handleChange = (plotId: string, templateId: string, val: string) => {
    setValues(prev => ({ ...prev, [cellKey(plotId, templateId)]: val }));
  };

  const handleBlur = (plotId: string, template: Template) => {
    const key = cellKey(plotId, template.id);
    persistCell(plotId, template, valuesRef.current[key] ?? '');
  };

  // Delegated paste handler — fires for any paste inside the table wrapper. Reads the
  // currently focused cell from focusedCellRef so we don't depend on the input being the
  // event target. Always preventDefault when there's clipboard text so the grid is the
  // single source of truth for inserted values.
  const handleTablePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;
    const anchor = focusedCellRef.current;
    if (!anchor) return; // No focused cell — fall through to default
    e.preventDefault();
    e.stopPropagation();

    const grid = parsePastedGrid(text);
    if (grid.length === 0) return;

    const currentPlots = plotsRef.current;
    const currentTemplates = templatesRef.current;

    // Build the new values map first so the UI updates immediately.
    const updates: Array<{ plotId: string; template: Template; raw: string }> = [];
    setValues(prev => {
      const next = { ...prev };
      for (let r = 0; r < grid.length; r++) {
        const plotIdx = anchor.plotIdx + r;
        if (plotIdx >= currentPlots.length) break;
        const plot = currentPlots[plotIdx];
        for (let c = 0; c < grid[r].length; c++) {
          const tplIdx = anchor.tplIdx + c;
          if (tplIdx >= currentTemplates.length) break;
          const template = currentTemplates[tplIdx];
          const raw = (grid[r][c] ?? '').trim();
          next[cellKey(plot.id, template.id)] = raw;
          updates.push({ plotId: plot.id, template, raw });
        }
      }
      // Keep the ref in sync immediately so blur on the focused input (which fires after
      // paste in some browsers) doesn't re-save the pre-paste value.
      valuesRef.current = next;
      return next;
    });

    // Persist sequentially so each insert can update the refs before the next one runs.
    for (const u of updates) {
      // eslint-disable-next-line no-await-in-loop
      await persistCell(u.plotId, u.template, u.raw);
    }
  };

  const handleAddPlot = async () => {
    const name = newPlotName.trim();
    if (!name) {
      toast.error('Plot name required');
      return;
    }
    const { error } = await supabase.from('plots').insert({
      site_id: siteId,
      plot_name: name,
      status: 'not_started',
    });
    if (error) {
      toast.error('Add failed: ' + error.message);
      return;
    }
    toast.success('Plot added');
    setNewPlotName('');
    setAddOpen(false);
    fetchAll();
  };

  if (loading) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Plots – price grid</h2>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Add plot
        </Button>
      </div>

      {plots.length === 0 ? (
        <div className="text-muted-foreground italic">No plots yet. Add one to get started.</div>
      ) : templates.length === 0 ? (
        <div className="text-muted-foreground italic">
          No task templates exist. Add some on the Task Templates page.
        </div>
      ) : (
        <div
          className="border rounded-lg overflow-auto max-h-[70vh]"
          onPaste={handleTablePaste}
        >
          <table className="text-sm border-collapse">
            <thead className="sticky top-0 z-20">
              <tr>
                <th className="text-left px-3 py-2 border-b font-medium sticky left-0 bg-muted z-30">
                  Plot
                </th>
                {templates.map(tpl => (
                  <th
                    key={tpl.id}
                    className={`px-3 py-2 border-b border-l font-medium whitespace-nowrap text-center ${
                      tpl.type === 'internal' ? 'bg-blue-50' : 'bg-amber-50'
                    }`}
                  >
                    <div>{tpl.name}</div>
                    <div className="text-[10px] uppercase text-muted-foreground font-normal">
                      {tpl.type}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plots.map((plot, plotIdx) => (
                <tr key={plot.id}>
                  <td className="px-3 py-1 border-b sticky left-0 bg-card font-medium z-10">
                    <button
                      type="button"
                      className="hover:underline text-left"
                      onClick={() => onOpenPlot({ id: plot.id, plot_name: plot.plot_name })}
                    >
                      {plot.plot_name}
                    </button>
                  </td>
                  {templates.map((tpl, tplIdx) => {
                    const key = cellKey(plot.id, tpl.id);
                    const raw = values[key] ?? '';
                    const num = raw === '' ? NaN : parseFloat(raw);
                    const stats = columnStats[tpl.id];
                    const bg =
                      stats && Number.isFinite(num)
                        ? colorFor(num, stats.min, stats.max)
                        : undefined;
                    return (
                      <td
                        key={tpl.id}
                        className="border-b border-l p-0 min-w-[100px]"
                        style={{ backgroundColor: bg }}
                      >
                        <input
                          type="text"
                          inputMode="decimal"
                          value={raw}
                          data-plot-idx={plotIdx}
                          data-template-idx={tplIdx}
                          onFocus={() => {
                            focusedCellRef.current = { plotIdx, tplIdx };
                          }}
                          onChange={e => handleChange(plot.id, tpl.id, e.target.value)}
                          onBlur={() => handleBlur(plot.id, tpl)}
                          className="w-full bg-transparent px-3 py-1 text-right outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add plot</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Plot name / number</Label>
              <Input
                value={newPlotName}
                onChange={e => setNewPlotName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddPlot();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddPlot}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
