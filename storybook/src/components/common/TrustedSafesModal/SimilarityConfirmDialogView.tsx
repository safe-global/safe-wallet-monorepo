import type { ReactElement, ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import type { FlaggedSafe, HashInfoSlotProps } from './SelectAllConfirmDialogView'

export type SimilarityConfirmDialogViewProps = {
  open: boolean
  safe: FlaggedSafe
  onCancel: () => void
  /** Renders the EthHashInfo container */
  renderAddress: (props: HashInfoSlotProps) => ReactNode
  /** Renders the DialogActions container */
  renderActions: (props: { className: string; confirmLabel: ReactNode }) => ReactNode
}

/**
 * Confirmation dialog for selecting an address flagged as similar to another address
 * Warns user about potential address poisoning attack
 */
export function SimilarityConfirmDialogView({
  open,
  safe,
  onCancel,
  renderAddress,
  renderActions,
}: SimilarityConfirmDialogViewProps): ReactElement {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Similar address detected</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-4">
          <Alert variant="warning" outlined={false}>
            <AlertSeverityIcon variant="warning" />
            <AlertDescription>
              This address is similar to another safe in your list. This could indicate an address poisoning attack.
            </AlertDescription>
          </Alert>

          <div>
            <p className="mb-1 text-sm text-muted-foreground">Selected safe</p>
            <div className="overflow-hidden rounded-md border border-border/50 bg-background p-4">
              {renderAddress({
                address: safe.address,
                showCopyButton: true,
                shortAddress: false,
                showAvatar: true,
                avatarSize: 32,
              })}
              {safe.name && <p className="mt-2 text-sm text-foreground">Name: {safe.name}</p>}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Verify the full address carefully. Continue only if you recognize this Safe.
          </p>
        </div>

        {renderActions({
          className: 'p-4',
          confirmLabel: (
            <>
              <TriangleAlert className="size-4" />I understand, continue anyway
            </>
          ),
        })}
      </DialogContent>
    </Dialog>
  )
}
