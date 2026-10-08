import type { ReactElement } from 'react'

import { Typography } from '@/components/ui/typography'
import { Button } from '@/components/ui/button'
import ModalDialog from '@/components/common/ModalDialog'

export type RemoveDialogViewProps = {
  name?: string
  onClose: () => void
  onConfirm: () => void
}

export function RemoveDialogView({ name, onClose, onConfirm }: RemoveDialogViewProps): ReactElement {
  return (
    <ModalDialog open onClose={onClose} dialogTitle="Delete entry">
      <div className="p-6">
        <Typography>
          Are you sure you want to permanently delete <b>{name}</b> from your address book?
        </Typography>
      </div>

      <div className="flex items-center justify-between gap-2 p-6 pt-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onConfirm} variant="destructive">
          Delete
        </Button>
      </div>
    </ModalDialog>
  )
}
