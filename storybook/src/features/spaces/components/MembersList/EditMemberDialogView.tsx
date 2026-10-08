import type { FormEvent, ReactNode } from 'react'
import ModalDialog from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'
import ErrorMessage from '@/components/tx/ErrorMessage'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

export type EditMemberDialogViewProps = {
  onClose: () => void
  isDarkMode: boolean
  onSubmit: (e?: FormEvent<HTMLFormElement>) => void
  displayName: string
  memberInfoForm: ReactNode
  error?: string
  canSubmit: boolean
}

export const EditMemberDialogView = ({
  onClose,
  isDarkMode,
  onSubmit,
  displayName,
  memberInfoForm,
  error,
  canSubmit,
}: EditMemberDialogViewProps) => {
  return (
    <ModalDialog open onClose={onClose} dialogTitle="Edit member" hideChainIndicator>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <form onSubmit={onSubmit}>
          <div className="p-6">
            <Typography variant="paragraph" className="mb-4">
              Edit <b>{displayName}</b> in this Workspace.
            </Typography>

            {memberInfoForm}
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </div>

          <DialogActions
            className="px-6 pb-6"
            onCancel={onClose}
            cancelTestId="cancel-btn"
            confirmLabel="Update"
            confirmType="submit"
            confirmDestructive
            confirmDisabled={!canSubmit}
            confirmTestId="delete-btn"
          />
        </form>
      </div>
    </ModalDialog>
  )
}
