import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Check, Clock, Trash2 } from 'lucide-react';
import { capitalize, formatDate } from './utils';
import type { PendingUser } from './types';

export function PendingSection({ users, onAction, onDelete }: {
  users: PendingUser[];
  onAction: (userId: string, status: 'approved' | 'rejected') => Promise<void>;
  onDelete: (userId: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState<PendingUser | null>(null);

  if (users.length === 0) return null;

  const handle = async (userId: string, status: 'approved' | 'rejected') => {
    setLoading(prev => ({ ...prev, [userId]: true }));
    await onAction(userId, status);
    setLoading(prev => ({ ...prev, [userId]: false }));
  };

  const field = (label: string, value: string | null) => (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm">{value || '—'}</p>
    </div>
  );

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
        <Clock className="h-4 w-4 text-orange-500" />
        Pending Approvals ({users.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map(u => (
          <div key={u.id} className="border rounded-lg p-4 bg-card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium">
                  {[u.first_name, u.last_name].filter(Boolean).map(s => capitalize(s)).join(' ') || '(no name)'}
                </h4>
                <p className="text-sm text-muted-foreground">{u.email || '—'}</p>
              </div>
              <Badge variant="outline" className="border-orange-500/50 text-orange-500">
                Pending
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {field('Phone', u.phone)}
              {field('Sort Code', u.sort_code)}
              {field('Account Number', u.account_number)}
              {field('National Insurance', u.national_insurance_number)}
              {field('UTR Number', u.utr_number)}
              {field('Signed Up', formatDate(u.created_at))}
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                disabled={!!loading[u.user_id]}
                onClick={() => handle(u.user_id, 'approved')}
              >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                {loading[u.user_id] ? 'Saving…' : 'Approve'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 border-red-500/50 text-red-500 hover:bg-red-500/10"
                disabled={!!loading[u.user_id]}
                onClick={() => setConfirmDelete(u)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Reject
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!confirmDelete} onOpenChange={open => { if (!open) setConfirmDelete(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject & Delete User</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Permanently reject and delete <span className="font-medium text-foreground">{confirmDelete && ([confirmDelete.first_name, confirmDelete.last_name].filter(Boolean).map(s => capitalize(s)).join(' ') || confirmDelete.email)}</span>? This removes their account entirely.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={!!confirmDelete && !!loading[confirmDelete.user_id]}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!!confirmDelete && !!loading[confirmDelete.user_id]}
              onClick={async () => {
                if (!confirmDelete) return;
                setLoading(prev => ({ ...prev, [confirmDelete.user_id]: true }));
                await onDelete(confirmDelete.user_id);
                setLoading(prev => ({ ...prev, [confirmDelete.user_id]: false }));
                setConfirmDelete(null);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {confirmDelete && loading[confirmDelete.user_id] ? 'Deleting…' : 'Reject & Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
