import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import { TriangleAlertIcon } from 'lucide-react'
import EthHashInfo from '@/components/common/EthHashInfo'
import type { SelectableItem } from '../../hooks/useSafeSelectionModal.types'

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Similar address detected</DialogTitle>
        </DialogHeader>

        <div className="px-4">
          <Alert variant="warning" className="mb-4">
            <AlertDescription>
              This address is similar to another safe in your list. This could indicate an address poisoning attack.
            </AlertDescription>
          </Alert>

          <div className="mb-4">
            <Typography variant="paragraph-small" color="muted" className="mb-2 block">
              Selected safe
            </Typography>
            <div className="bg-background border-border rounded-md border p-4">
              <EthHashInfo address={safe.address} showCopyButton shortAddress={false} showAvatar avatarSize={32} />
              {safe.name && (
                <Typography variant="paragraph-small" className="mt-2 block">
                  Name: {safe.name}
                </Typography>
              )}
            </div>
          </div>

          <Typography variant="paragraph-small" color="muted">
            Verify the full address carefully. Continue only if you recognize this Safe.
          </Typography>
        </div>

        <DialogFooter className="flex-row justify-end">
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={onConfirm}>
            <TriangleAlertIcon className="size-4" />I understand, continue anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SimilarityConfirmDialog
