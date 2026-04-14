import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { ArchivedPlotEntry, Plot, TaskType } from './types';

export interface AddUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newPlotName: string;
  setNewPlotName: (v: string) => void;
  onAdd: () => void;
}

export function AddUnitDialog({
  open, onOpenChange, newPlotName, setNewPlotName, onAdd,
}: AddUnitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add unit</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Unit name / number</Label>
            <Input
              value={newPlotName}
              onChange={e => setNewPlotName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') onAdd();
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onAdd}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface AddVariationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variationName: string;
  setVariationName: (v: string) => void;
  variationType: TaskType;
  setVariationType: (v: TaskType) => void;
  variationPrice: string;
  setVariationPrice: (v: string) => void;
  variationApplyTo: string;
  setVariationApplyTo: (v: string) => void;
  plots: Plot[];
  onAdd: () => void;
}

export function AddVariationDialog({
  open, onOpenChange,
  variationName, setVariationName,
  variationType, setVariationType,
  variationPrice, setVariationPrice,
  variationApplyTo, setVariationApplyTo,
  plots, onAdd,
}: AddVariationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add variation</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Task name</Label>
            <Input
              value={variationName}
              onChange={e => setVariationName(e.target.value)}
              placeholder="e.g. Feature wall"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Price type</Label>
            <Select
              value={variationType}
              onValueChange={v => setVariationType(v as TaskType)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="garage">Garage</SelectItem>
                <SelectItem value="external">External</SelectItem>
                <SelectItem value="variation">Variation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Price (optional)</Label>
            <Input
              type="text"
              inputMode="decimal"
              value={variationPrice}
              onChange={e => setVariationPrice(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') onAdd();
              }}
              placeholder="Leave blank to fill in per plot"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Apply to</Label>
            <Select value={variationApplyTo} onValueChange={setVariationApplyTo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All units</SelectItem>
                {plots.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    Unit {p.plot_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            {variationApplyTo === 'all'
              ? "Adds this task to every unit on the site. Blank a cell in the grid to remove it from units that don't need it."
              : 'Adds this task to the selected unit only. You can add it to other units later by typing a price into an empty cell in the grid.'}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onAdd}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface ArchivePlotConfirmProps {
  plot: Plot | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function ArchivePlotConfirm({ plot, onClose, onConfirm }: ArchivePlotConfirmProps) {
  return (
    <ConfirmDialog
      open={!!plot}
      onClose={onClose}
      onConfirm={onConfirm}
      title={plot ? `Archive unit ${plot.plot_name}?` : 'Archive unit?'}
      description="The unit is hidden from the grid but its task prices are kept. You can restore it from Show archived."
    />
  );
}

export interface ArchivedUnitsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  archivedPlots: ArchivedPlotEntry[];
  onRestore: (plotId: string) => void;
  onHardDeleteRequest: (plot: ArchivedPlotEntry) => void;
}

export function ArchivedUnitsDialog({
  open, onOpenChange, loading, archivedPlots, onRestore, onHardDeleteRequest,
}: ArchivedUnitsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archived units</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : archivedPlots.length === 0 ? (
            <div className="text-sm text-muted-foreground italic">No archived units</div>
          ) : (
            <ul className="divide-y border rounded-md">
              {archivedPlots.map(p => (
                <li key={p.id} className="flex items-center gap-3 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">Unit {p.plot_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.sections.length === 0
                        ? 'No tasks'
                        : p.sections
                            .map(s => s.charAt(0).toUpperCase() + s.slice(1) + (s === 'variation' ? 's' : ''))
                            .join(', ')}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onRestore(p.id)}>
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onHardDeleteRequest(p)}
                    title="Permanently delete this unit and all its data"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export interface DeleteVariationConfirmProps {
  variation: { name: string; type: TaskType } | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteVariationConfirm({ variation, onClose, onConfirm }: DeleteVariationConfirmProps) {
  return (
    <ConfirmDialog
      open={!!variation}
      onClose={onClose}
      onConfirm={onConfirm}
      title={
        variation
          ? `Delete variation "${variation.name}"?`
          : 'Delete variation?'
      }
      description="This removes the variation column from every unit on this site."
    />
  );
}

export interface HardDeletePlotConfirmProps {
  plot: ArchivedPlotEntry | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function HardDeletePlotConfirm({ plot, onClose, onConfirm }: HardDeletePlotConfirmProps) {
  return (
    <ConfirmDialog
      open={!!plot}
      onClose={onClose}
      onConfirm={onConfirm}
      title={
        plot
          ? `Permanently delete unit ${plot.plot_name}?`
          : 'Delete unit?'
      }
      description="This permanently removes the unit and all of its task data. This cannot be undone."
    />
  );
}

export interface BulkDeleteConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
}

export function BulkDeleteConfirm({ open, onClose, onConfirm, count }: BulkDeleteConfirmProps) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Permanently delete ${count} unit${count === 1 ? '' : 's'}?`}
      description="This permanently removes the selected units and all of their task data. This cannot be undone."
    />
  );
}
