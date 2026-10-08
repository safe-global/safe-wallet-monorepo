import type { ReactElement } from 'react'
import ModalDialog from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'
import { Typography } from '@/components/ui/typography'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { cn } from '@/utils/cn'

export type RemoveSafeDialogViewProps = {
  address: string
  hasError: boolean
  isDarkMode: boolean
  onClose: () => void
  onConfirm: () => void
}

export const RemoveSafeDialogView = ({
  address,
  hasError,
  isDarkMode,
  onClose,
  onConfirm,
}: RemoveSafeDialogViewProps): ReactElement => (
  <ModalDialog open onClose={onClose} dialogTitle="Remove Safe account" hideChainIndicator>
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className="p-6">
        <Typography variant="paragraph">
          Are you sure you want to remove <b>{address}</b> from this space?
        </Typography>
        {hasError && (
          <Alert variant="destructive" className="mt-4">
            <AlertSeverityIcon variant="destructive" />
            <AlertDescription>Error removing safe account.</AlertDescription>
          </Alert>
        )}
      </div>

      <DialogActions
        className="px-6 pb-6"
        onCancel={onClose}
        cancelTestId="cancel-btn"
        confirmLabel="Remove"
        onConfirm={onConfirm}
        confirmTestId="delete-btn"
        confirmDestructive
      />
    </div>
  </ModalDialog>
)
