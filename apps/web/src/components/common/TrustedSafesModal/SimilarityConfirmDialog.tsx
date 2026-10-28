import { TriangleAlert } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import DialogActions from '@/components/common/DialogActions'
import EthHashInfo from '@/components/common/EthHashInfo'

interface SimilarityConfirmDialogProps {
  open: boolean
  /** Only the address and name are rendered, so any flagged safe/line can be passed. */
  safe: { address: string; name?: string }
  onConfirm: () => void
  onCancel: () => void
  /** Copy defaults to a Safe in the trusted-Safes list; override it for other kinds of address. */
  description?: string
  addressLabel?: string
  hint?: string
  /** Opened over a raised overlay? Pass that overlay's stacking classes, e.g. `z-[var(--z-nested-overlay)]`. */
  className?: string
  overlayClassName?: string
}

/**
 * Confirmation dialog for selecting an address flagged as similar to another address
 * Warns user about potential address poisoning attack
 */
const SimilarityConfirmDialog = ({
  open,
  safe,
  onConfirm,
  onCancel,
  description = 'This address is similar to another safe in your list. This could indicate an address poisoning attack.',
  addressLabel = 'Selected safe',
  hint = 'Verify the full address carefully. Continue only if you recognize this Safe.',
  className,
  overlayClassName,
}: SimilarityConfirmDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent size="sm" className={className} overlayClassName={overlayClassName} forceBackdrop>
        <DialogHeader>
          <DialogTitle>Similar address detected</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-4">
          <Alert variant="warning" outlined={false}>
            <AlertSeverityIcon variant="warning" />
            <AlertDescription>{description}</AlertDescription>
          </Alert>

          <div>
            <p className="mb-1 text-sm text-muted-foreground">{addressLabel}</p>
            <div className="overflow-hidden rounded-md border border-border/50 bg-background p-4">
              <EthHashInfo
                address={safe.address}
                shortAddress={false}
                showPrefix={false}
                showCopyButton
                highlight4bytes
                showAvatar
                avatarSize={32}
              />
              {safe.name && <p className="mt-2 text-sm text-foreground">Name: {safe.name}</p>}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>

        <DialogActions
          className="p-4"
          onCancel={onCancel}
          onConfirm={onConfirm}
          confirmLabel={
            <>
              <TriangleAlert className="size-4" />I understand, continue anyway
            </>
          }
        />
      </DialogContent>
    </Dialog>
  )
}

export default SimilarityConfirmDialog
