import type { MutableRefObject } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';
import type { Plot, PlotTaskRow, Template, TaskType } from './types';
import { cellKey, customKey } from './utils';
import { PriceGridRowActions } from './PriceGridRowActions';

export interface PriceGridTableProps {
  groupType: TaskType;
  label: string;
  plots: Plot[];
  templates: Template[];
  tasks: PlotTaskRow[];
  values: Record<string, string>;
  selectedPlotIds: Set<string>;
  valuesRef: MutableRefObject<Record<string, string>>;
  focusedCellRef: MutableRefObject<{ plotIdx: number; tplIdx: number } | null>;
  plotNameAtFocusRef: MutableRefObject<string | null>;
  onTablePaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
  onToggleSelectAll: () => void;
  onTogglePlotSelection: (id: string) => void;
  onMovePlot: (plot: Plot, dir: -1 | 1) => void;
  onArchivePlot: (plot: Plot) => void;
  onDeleteVariation: (col: { name: string; type: TaskType }) => void;
  onPersistPlotName: (plotId: string, raw: string) => void;
  onPlotNameChange: (plotId: string, val: string) => void;
  onPlotNamePaste: (e: React.ClipboardEvent<HTMLInputElement>, plotIdx: number) => void;
  onCellChange: (plotId: string, templateId: string, val: string) => void;
  onCellBlur: (plotId: string, template: Template) => void;
  onCustomCellChange: (plotId: string, type: TaskType, name: string, val: string) => void;
  onCustomCellPersist: (plotId: string, type: TaskType, name: string, value: string) => void;
}

export function PriceGridTable({
  groupType,
  label,
  plots,
  templates,
  tasks,
  values,
  selectedPlotIds,
  valuesRef,
  focusedCellRef,
  plotNameAtFocusRef,
  onTablePaste,
  onToggleSelectAll,
  onTogglePlotSelection,
  onMovePlot,
  onArchivePlot,
  onDeleteVariation,
  onPersistPlotName,
  onPlotNameChange,
  onPlotNamePaste,
  onCellChange,
  onCellBlur,
  onCustomCellChange,
  onCustomCellPersist,
}: PriceGridTableProps) {
  const groupTemplates = templates
    .map((tpl, idx) => ({ tpl, idx }))
    .filter(({ tpl }) => tpl.type === groupType);

  // Distinct custom-column names for this group, ordered by sort_order then name.
  const customCols: { name: string; sortOrder: number }[] = [];
  const seen = new Set<string>();
  for (const t of tasks) {
    if (t.type !== groupType || t.task_template_id != null) continue;
    if (seen.has(t.name)) continue;
    seen.add(t.name);
    customCols.push({ name: t.name, sortOrder: t.sort_order });
  }
  customCols.sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)
  );

  if (groupTemplates.length === 0 && customCols.length === 0) {
    if (groupType === 'variation') return null;
    return (
      <div id={`section-${groupType}`} className="space-y-2 scroll-mt-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </h3>
        <div className="text-sm text-muted-foreground italic">
          No {label.toLowerCase()} task templates.
        </div>
      </div>
    );
  }

  const totalDataCols = groupTemplates.length + customCols.length;
  // Equal-width price columns. Actions + plot-name columns are fixed.
  const dataColWidth = totalDataCols > 0 ? `${100 / totalDataCols}%` : undefined;

  return (
    <section id={`section-${groupType}`} className="space-y-3 scroll-mt-4">
      <div className="flex items-center gap-3">
        <h3 className="text-2xl font-bold uppercase tracking-widest text-foreground">
          {label}
        </h3>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div
        className="border rounded-lg shadow-sm overflow-hidden"
        onPaste={onTablePaste}
      >
        <table className="text-sm border-collapse w-full table-fixed">
          <colgroup>
            <col style={{ width: '128px' }} />
            <col style={{ width: '120px' }} />
            {groupTemplates.map(({ tpl }) => (
              <col key={tpl.id} style={{ width: dataColWidth }} />
            ))}
            {customCols.map(col => (
              <col key={`c:${col.name}`} style={{ width: dataColWidth }} />
            ))}
          </colgroup>
          <thead
            className="sticky top-0 z-10"
            style={{ backgroundColor: '#383B3D' }}
          >
            <tr>
              <th
                className="px-1 py-3 border-b border-border bg-card text-[#C2C9CC] text-[12px] font-semibold uppercase tracking-wider"
              >
                <div className="relative flex items-center pl-1">
                  <Checkbox
                    checked={
                      plots.length > 0 && selectedPlotIds.size === plots.length
                    }
                    onCheckedChange={onToggleSelectAll}
                    aria-label="Select all units"
                    className="h-4 w-4"
                  />
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    Actions
                  </span>
                </div>
              </th>
              <th className="px-3 py-3 border-b border-border bg-card text-[#C2C9CC] text-[12px] font-semibold uppercase tracking-wider text-center">
                Unit
              </th>
              {groupTemplates.map(({ tpl }) => (
                <th
                  key={tpl.id}
                  className="px-3 py-3 border-b border-border bg-card text-[#C2C9CC] text-[12px] font-semibold uppercase tracking-wider text-center whitespace-nowrap"
                >
                  {tpl.name}
                </th>
              ))}
              {customCols.map(col => (
                <th
                  key={`custom:${col.name}`}
                  className="px-3 py-3 border-b border-border bg-card text-[#C2C9CC] text-[12px] font-semibold uppercase tracking-wider text-center whitespace-nowrap italic"
                  title="Variation column — blank a cell to remove from that unit"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span>{col.name}</span>
                    <button
                      type="button"
                      onClick={() =>
                        onDeleteVariation({ name: col.name, type: groupType })
                      }
                      aria-label={`Delete variation ${col.name}`}
                      title="Delete this variation from all units"
                      className="inline-flex items-center justify-center h-5 w-5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plots.map((plot, plotIdx) => (
              <tr key={plot.id} className="even:bg-[#191B1C] hover:bg-[#595F61]/60">
                <PriceGridRowActions
                  plot={plot}
                  plotIdx={plotIdx}
                  plotsLength={plots.length}
                  selected={selectedPlotIds.has(plot.id)}
                  onToggleSelect={() => onTogglePlotSelection(plot.id)}
                  onMoveUp={() => onMovePlot(plot, -1)}
                  onMoveDown={() => onMovePlot(plot, 1)}
                  onArchive={() => onArchivePlot(plot)}
                />
                <td className="border-b border-r border-[#383B3D] p-0 font-semibold align-middle text-[#EDEFF0]">
                  <input
                    type="text"
                    value={plot.plot_name}
                    onFocus={() => {
                      focusedCellRef.current = null;
                      plotNameAtFocusRef.current = plot.plot_name;
                    }}
                    onBlur={() => {
                      onPersistPlotName(plot.id, plot.plot_name);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    onChange={e => onPlotNameChange(plot.id, e.target.value)}
                    onPaste={e => onPlotNamePaste(e, plotIdx)}
                    className="w-full h-full bg-transparent px-3 py-2 text-center font-semibold text-[#EDEFF0] outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                  />
                </td>
                {groupTemplates.map(({ tpl, idx: tplIdx }) => {
                  const key = cellKey(plot.id, tpl.id);
                  const raw = values[key] ?? '';
                  return (
                    <td
                      key={tpl.id}
                      className="border-b border-l border-[#383B3D] p-0 align-middle"
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
                        onChange={e => onCellChange(plot.id, tpl.id, e.target.value)}
                        onBlur={() => onCellBlur(plot.id, tpl)}
                        className="w-full h-full bg-transparent px-3 py-2 text-center tabular-nums text-[#EDEFF0] outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                      />
                    </td>
                  );
                })}
                {customCols.map(col => {
                  const key = customKey(plot.id, groupType, col.name);
                  const raw = values[key] ?? '';
                  return (
                    <td
                      key={`custom:${col.name}`}
                      className="border-b border-l border-[#383B3D] p-0 align-middle"
                    >
                      <input
                        type="text"
                        inputMode="decimal"
                        value={raw}
                        onFocus={() => {
                          // Custom columns are not a valid paste anchor — paste expects
                          // a template index, which variation columns don't have.
                          focusedCellRef.current = null;
                        }}
                        onChange={e =>
                          onCustomCellChange(plot.id, groupType, col.name, e.target.value)
                        }
                        onBlur={() =>
                          onCustomCellPersist(
                            plot.id,
                            groupType,
                            col.name,
                            valuesRef.current[key] ?? ''
                          )
                        }
                        className="w-full h-full bg-transparent px-3 py-2 text-center tabular-nums text-[#EDEFF0] outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
