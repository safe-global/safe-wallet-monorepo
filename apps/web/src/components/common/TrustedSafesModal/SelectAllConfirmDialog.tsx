import { TriangleAlert } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import EthHashInfo from '@/components/common/EthHashInfo'
import type { SelectableItem } from './useTrustedSafesModal.types'

interface SelectAllConfirmDialogProps {
  open: boolean
  similarAddresses: SelectableItem[]
  onConfirm: () => void
  onSkip: () => void
  onCancel: () => void
}

const SelectAllConfirmDialog = ({
  open,
  similarAddresses,
  onConfirm,
  onSkip,
  onCancel,
}: SelectAllConfirmDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Similar addresses detected</DialogTitle>
        </DialogHeader>

        <Alert variant="warning" className="mb-4">
          <AlertDescription>
            {similarAddresses.length} Safe{similarAddresses.length === 1 ? '' : 's'} in your list closely resemble other
            addresses. Review them carefully before continuing.
          </AlertDescription>
        </Alert>

        <p className="mb-4 text-sm text-muted-foreground">The following addresses have been flagged as similar:</p>

        <ul className="max-h-[200px] overflow-auto rounded-md border border-border/50 bg-background">
          {similarAddresses.map((item) => (
            <li key={item.address} className="px-3 py-2">
              <div className="w-full">
                <EthHashInfo address={item.address} showCopyButton shortAddress={false} showAvatar avatarSize={24} />
                {item.name && <span className="text-xs text-muted-foreground">{item.name}</span>}
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-sm text-muted-foreground">Do you want to include these addresses in your selection?</p>

        <DialogFooter>
          <Button onClick={onSkip} variant="ghost">
            No, skip similar addresses
          </Button>
          <Button onClick={onConfirm}>
            <TriangleAlert className="size-4" />
            Yes, include them anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SelectAllConfirmDialog
