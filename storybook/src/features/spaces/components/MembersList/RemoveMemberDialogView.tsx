import ModalDialog from '@/components/common/ModalDialog'
import ErrorMessage from '@/components/tx/ErrorMessage'
import DialogActions from '@/components/common/DialogActions'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

export type RemoveMemberDialogViewProps = {
  memberName: string
  isInvite: boolean
  onClose: () => void
  onConfirm: () => void
  isDarkMode: boolean
  errorMessage: string
}

export const RemoveMemberDialogView = ({
  memberName,
  isInvite,
  onClose,
  onConfirm,
  isDarkMode,
  errorMessage,
}: RemoveMemberDialogViewProps) => {
  return (
    <ModalDialog
      open
      onClose={onClose}
      dialogTitle={isInvite ? 'Remove invitation' : 'Remove member'}
      hideChainIndicator
    >
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <div className="p-6">
          <Typography variant="paragraph">
            {isInvite ? `Are you sure you want to remove the invitation for ` : `Are you sure you want to remove `}
            <b>{memberName}</b>
            {isInvite ? `` : ` from this space?`}
          </Typography>
          {errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        </div>

        <DialogActions
          className="px-6 pb-6"
          onCancel={onClose}
          cancelTestId="cancel-btn"
          confirmLabel="Remove"
          onConfirm={onConfirm}
          confirmDestructive
          confirmTestId="delete-btn"
        />
      </div>
    </ModalDialog>
  )
}
