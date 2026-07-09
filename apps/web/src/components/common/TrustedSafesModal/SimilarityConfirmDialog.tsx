import { TriangleAlert } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import DialogActions from '@/components/common/DialogActions'
import EthHashInfo from '@/components/common/EthHashInfo'
import type { SelectableItem } from './useTrustedSafesModal.types'

interface SimilarityConfirmDialogProps {
  open: boolean
  safe: SelectableItem
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Confirmation dialog for selecting an address flagged as similar to another address
 * Warns user about potential address poisoning attack
 */
const SimilarityConfirmDialog = ({ open, safe, onConfirm, onCancel }: SimilarityConfirmDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Similar address detected</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-4">
          <Alert variant="warning">
            <AlertDescription>
              This address is similar to another safe in your list. This could indicate an address poisoning attack.
            </AlertDescription>
          </Alert>

          <div>
            <p className="mb-1 text-sm text-muted-foreground">Selected safe</p>
            <div className="overflow-hidden rounded-md border border-border/50 bg-background p-4">
              <EthHashInfo address={safe.address} showCopyButton shortAddress={false} showAvatar avatarSize={32} />
              {safe.name && <p className="mt-2 text-sm text-foreground">Name: {safe.name}</p>}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Verify the full address carefully. Continue only if you recognize this Safe.
          </p>
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
