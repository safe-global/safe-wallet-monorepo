import type { ReactElement, ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'

export type FlaggedSafe = { address: string; name?: string }

export type HashInfoSlotProps = {
  address: string
  showCopyButton: boolean
  shortAddress: boolean
  showAvatar: boolean
  avatarSize: number
}

export type SelectAllConfirmDialogViewProps = {
  open: boolean
  similarAddresses: FlaggedSafe[]
  onConfirm: () => void
  onSkip: () => void
  onCancel: () => void
  /** Renders the EthHashInfo container */
  renderAddress: (props: HashInfoSlotProps) => ReactNode
}

export function SelectAllConfirmDialogView({
  open,
  similarAddresses,
  onConfirm,
  onSkip,
  onCancel,
  renderAddress,
}: SelectAllConfirmDialogViewProps): ReactElement {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Similar addresses detected</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-4">
          <Alert variant="warning" outlined={false}>
            <AlertSeverityIcon variant="warning" />
            <AlertDescription>
              {similarAddresses.length} Safe{similarAddresses.length === 1 ? '' : 's'} in your list closely resemble
              other addresses. Review them carefully before continuing.
            </AlertDescription>
          </Alert>

          <p className="text-sm text-muted-foreground">The following addresses have been flagged as similar:</p>

          <ul className="max-h-[200px] overflow-auto rounded-md border border-border/50 bg-background">
            {similarAddresses.map((item) => (
              <li key={item.address} className="px-3 py-2">
                <div className="w-full">
                  {renderAddress({
                    address: item.address,
                    showCopyButton: true,
                    shortAddress: false,
                    showAvatar: true,
                    avatarSize: 24,
                  })}
                  {item.name && <span className="text-xs text-muted-foreground">{item.name}</span>}
                </div>
              </li>
            ))}
          </ul>

          <p className="text-sm text-muted-foreground">Do you want to include these addresses in your selection?</p>
        </div>

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
