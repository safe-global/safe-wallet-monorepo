import { Bell, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@safe-global/views/components/ui/alert-dialog'
import DialogActions from '@/components/common/DialogActions'
import { othersMissing, people } from '../services/actions'
import { getTransactionLabel } from '../services/model'
import type { Proposal } from '../types'

export type PendingConfirm = { kind: 'delete' | 'remind'; tx: Proposal }

const listNames = (names: string[]) =>
  names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : (names[0] ?? 'the other signers')

// Delete copies the production DeleteTxModal. Remind is new and asks before it notifies signers.
export function ConfirmActionDialog({
  confirm,
  onCancel,
  onConfirm,
}: {
  confirm: PendingConfirm | null
  onCancel: () => void
  onConfirm: (confirm: PendingConfirm) => void
}) {
  if (!confirm) return null
  const { kind, tx } = confirm
  const label = `${getTransactionLabel(tx)} (#${tx.nonce})`
  const names = othersMissing(tx)
  const isDelete = kind === 'delete'
  const Icon = isDelete ? Trash2 : Bell
  return (
    <AlertDialog open onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${isDelete ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'}`}
          >
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <AlertDialogTitle>{isDelete ? 'Delete this transaction?' : `Remind ${people(names)}?`}</AlertDialogTitle>
          <AlertDialogDescription>
            {isDelete
              ? `${label} is removed from the queue. Signatures already given stay valid, so it could still be submitted on-chain later.`
              : `${listNames(names)} will get a notification asking them to review and sign ${label}.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <DialogActions
            onCancel={onCancel}
            cancelLabel={isDelete ? 'Keep it' : 'Cancel'}
            confirmLabel={isDelete ? 'Yes, delete' : 'Send reminder'}
            confirmDestructive={isDelete}
            onConfirm={() => onConfirm(confirm)}
          />
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
