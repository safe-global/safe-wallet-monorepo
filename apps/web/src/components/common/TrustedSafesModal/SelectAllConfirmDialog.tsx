import { TriangleAlert } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@safe-global/views/components/ui/dialog'
import { Button } from '@safe-global/views/components/ui/button'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import EthHashInfo from '@/components/common/EthHashInfo'

interface SelectAllConfirmDialogProps {
  open: boolean
  similarAddresses: Array<{ address: string; name?: string }>
  onConfirm: () => void
  onSkip: () => void
  onCancel: () => void
  /** Copy defaults to Safes picked in the trusted-Safes list; override it for other kinds of address. */
  description?: string
  question?: string
  confirmLabel?: string
}

const SelectAllConfirmDialog = ({
  open,
  similarAddresses,
  onConfirm,
  onSkip,
  onCancel,
  description = `${similarAddresses.length} Safe${similarAddresses.length === 1 ? '' : 's'} in your list closely resemble other addresses. Review them carefully before continuing.`,
  question = 'Do you want to include these addresses in your selection?',
  confirmLabel = 'Yes, include them anyway',
}: SelectAllConfirmDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent size="sm" forceBackdrop>
        <DialogHeader>
          <DialogTitle>Similar addresses detected</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-4">
          <Alert variant="warning" outlined={false}>
            <AlertSeverityIcon variant="warning" />
            <AlertDescription>{description}</AlertDescription>
          </Alert>

          <p className="text-sm text-muted-foreground">The following addresses have been flagged as similar:</p>

          <ul className="max-h-[200px] overflow-auto rounded-md border border-border/50 bg-background">
            {similarAddresses.map((item) => (
              <li key={item.address} className="px-3 py-2">
                <div className="w-full">
                  <EthHashInfo
                    address={item.address}
                    shortAddress={false}
                    showPrefix={false}
                    showCopyButton
                    highlight4bytes
                    showAvatar
                    avatarSize={24}
                  />
                  {item.name && <span className="text-xs text-muted-foreground">{item.name}</span>}
                </div>
              </li>
            ))}
          </ul>

          <p className="text-sm text-muted-foreground">{question}</p>
        </div>

        <DialogFooter>
          <Button onClick={onSkip} variant="ghost">
            No, skip similar addresses
          </Button>
          <Button onClick={onConfirm}>
            <TriangleAlert className="size-4" />
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SelectAllConfirmDialog
