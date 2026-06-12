import { XIcon, InfoIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import CopyButton from '@/components/common/CopyButton'
import ledgerHashStore from '../../store/ledgerHashStore'
import {
  DIALOG_TITLE,
  DIALOG_DESCRIPTION,
  CLOSE_BUTTON_TEXT,
  HASH_DISPLAY_WIDTH,
  HASH_DISPLAY_LIMIT,
} from '../../constants'

const LedgerHashComparison = () => {
  const hash = ledgerHashStore.useStore()
  const open = !!hash

  const handleClose = () => {
    ledgerHashStore.setStore(undefined)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) handleClose()
      }}
    >
      <DialogContent showCloseButton={false} className="max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{DIALOG_TITLE}</DialogTitle>
            <Button onClick={handleClose} variant="ghost" size="icon-sm">
              <XIcon />
            </Button>
          </div>
        </DialogHeader>

        <div className="px-4">
          <Alert className="mb-6">
            <InfoIcon />
            <AlertDescription>{DIALOG_DESCRIPTION}</AlertDescription>
          </Alert>

          <div className="flex flex-row items-center justify-center">
            <div
              className="bg-card relative box-content rounded-lg px-24 py-2 shadow-lg"
              style={{ maxWidth: HASH_DISPLAY_WIDTH }}
            >
              <HexEncodedData hexData={hash || ''} highlightFirstBytes={false} limit={HASH_DISPLAY_LIMIT} />

              <div className="absolute top-0.5 right-0.5">
                <CopyButton text={hash || ''} />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} variant="default">
            {CLOSE_BUTTON_TEXT}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LedgerHashComparison
