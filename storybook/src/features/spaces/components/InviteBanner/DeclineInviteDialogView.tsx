import ModalDialog from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

export type DeclineInviteDialogViewProps = {
  spaceName: string
  onClose: () => void
  onConfirm: () => void
  isDarkMode: boolean
  errorMessage: string
}

export const DeclineInviteDialogView = ({
  spaceName,
  onClose,
  onConfirm,
  isDarkMode,
  errorMessage,
}: DeclineInviteDialogViewProps) => {
  return (
    <ModalDialog open onClose={onClose} dialogTitle="Decline invitation" hideChainIndicator>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <div className="p-6">
          <Typography variant="paragraph">
            Are you sure you want to decline the invitation to <b>{spaceName}</b>?
          </Typography>
          {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        </div>

        <DialogActions
          className="px-6 pb-6"
          onCancel={onClose}
          cancelTestId="cancel-btn"
          confirmLabel="Decline"
          onConfirm={onConfirm}
          confirmDestructive
          confirmTestId="decline-btn"
        />
      </div>
    </ModalDialog>
  )
}
