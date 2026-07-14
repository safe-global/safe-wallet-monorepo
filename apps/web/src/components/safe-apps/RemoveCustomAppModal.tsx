import * as React from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import ModalDialog from '@/components/common/ModalDialog'

type Props = {
  open: boolean
  app: SafeAppData
  onClose: () => void
  onConfirm: (appId: number) => void
}

const RemoveCustomAppModal = ({ open, onClose, onConfirm, app }: Props) => (
  <ModalDialog open={open} onClose={onClose} dialogTitle="Confirm Safe App removal">
    <div className="px-6 pb-4">
      <Typography variant="h4" className="pt-6">
        Are you sure you want to remove the <b>{app.name}</b> app?
      </Typography>
    </div>
    <div className="flex justify-end gap-2 p-6 pt-2">
      <Button variant="ghost" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="destructive" onClick={() => onConfirm(app.id)}>
        Remove
      </Button>
    </div>
  </ModalDialog>
)

export { RemoveCustomAppModal }
