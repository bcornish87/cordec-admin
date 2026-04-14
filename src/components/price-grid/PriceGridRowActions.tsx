import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUp, ArrowDown, Archive } from 'lucide-react';
import type { Plot } from './types';

export interface PriceGridRowActionsProps {
  plot: Plot;
  plotIdx: number;
  plotsLength: number;
  selected: boolean;
  onToggleSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onArchive: () => void;
}

export function PriceGridRowActions({
  plot,
  plotIdx,
  plotsLength,
  selected,
  onToggleSelect,
  onMoveUp,
  onMoveDown,
  onArchive,
}: PriceGridRowActionsProps) {
  return (
    <td className="px-1 py-1 border-b border-r border-border align-middle">
      <div className="flex items-center justify-start gap-1 pl-1">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggleSelect}
          aria-label={`Select plot ${plot.plot_name}`}
          className="h-4 w-4"
        />
        <button
          type="button"
          disabled={plotIdx === 0}
          onClick={onMoveUp}
          aria-label={`Move plot ${plot.plot_name} up`}
          title="Move up"
          className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          disabled={plotIdx === plotsLength - 1}
          onClick={onMoveDown}
          aria-label={`Move plot ${plot.plot_name} down`}
          title="Move down"
          className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onArchive}
          aria-label={`Archive plot ${plot.plot_name}`}
          title="Archive unit"
          className="inline-flex items-center justify-center h-7 w-7 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Archive className="h-3.5 w-3.5" />
        </button>
      </div>
    </td>
  );
}
