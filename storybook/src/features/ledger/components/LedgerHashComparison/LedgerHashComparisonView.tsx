import type { ReactNode } from 'react'
import { XIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { DIALOG_TITLE, DIALOG_DESCRIPTION, CLOSE_BUTTON_TEXT, HASH_DISPLAY_WIDTH } from '@/features/ledger/constants'

export type LedgerHashComparisonViewProps = {
  open: boolean
  onClose: () => void
  hexData: ReactNode
  copyButton: ReactNode
  renderDialogActions: (props: { confirmLabel: string; onConfirm: () => void; className: string }) => ReactNode
}

export const LedgerHashComparisonView = ({
  open,
  onClose,
  hexData,
  copyButton,
  renderDialogActions,
}: LedgerHashComparisonViewProps) => {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent showCloseButton={false} size="sm">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{DIALOG_TITLE}</DialogTitle>
            <Button onClick={onClose} variant="ghost" size="icon-sm">
              <XIcon />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-4">
          <Alert variant="info" className="mb-6">
            <AlertSeverityIcon variant="info" />
            <AlertDescription>{DIALOG_DESCRIPTION}</AlertDescription>
          </Alert>

          <div className="flex flex-row items-center justify-center">
            <div
              className="bg-card relative box-content rounded-lg px-24 py-2 shadow-lg"
              style={{ maxWidth: HASH_DISPLAY_WIDTH }}
            >
              {hexData}

              <div className="absolute top-0.5 right-0.5">{copyButton}</div>
            </div>
          </div>
        </div>

        {renderDialogActions({ confirmLabel: CLOSE_BUTTON_TEXT, onConfirm: onClose, className: 'p-4' })}
      </DialogContent>
    </Dialog>
  )
}
