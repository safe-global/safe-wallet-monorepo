import { type FormEvent, type ReactElement, type ReactNode } from 'react'
import ModalDialog from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'
import memberIcon from '@/public/images/spaces/member.svg'
import adminIcon from '@/public/images/spaces/admin.svg'
import { Typography } from '@/components/ui/typography'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { cn } from '@/utils/cn'
import css from './styles.module.css'

export type RoleMenuItemViewProps = {
  isAdmin: boolean
  hasDescription?: boolean
}

export const RoleMenuItemView = ({ isAdmin, hasDescription = false }: RoleMenuItemViewProps): ReactElement => {
  const Icon = isAdmin ? adminIcon : memberIcon

  return (
    <div className={cn('w-full items-center', css.roleMenuItem)}>
      <div className="flex items-center" style={{ gridArea: 'icon' }}>
        <Icon className="size-4" />
      </div>
      <Typography variant={hasDescription ? 'paragraph-bold' : 'paragraph'} style={{ gridArea: 'title' }}>
        {isAdmin ? 'Admin' : 'Member'}
      </Typography>
      {hasDescription && (
        <div style={{ gridArea: 'description' }}>
          <Typography variant="paragraph-small" className="max-w-[300px] break-words whitespace-normal">
            {isAdmin
              ? 'Admins can create and delete Workspaces, invite members, and more.'
              : 'Can view the Workspace data.'}
          </Typography>
        </div>
      )}
    </div>
  )
}

export type AddMemberModalViewProps = {
  onClose: () => void
  isDarkMode: boolean
  onSubmit: (e?: FormEvent<HTMLFormElement>) => void
  memberInfoForm: ReactNode
  addMemberInput: ReactNode
  error?: string
  isValid: boolean
  isSubmitting: boolean
}

export const AddMemberModalView = ({
  onClose,
  isDarkMode,
  onSubmit,
  memberInfoForm,
  addMemberInput,
  error,
  isValid,
  isSubmitting,
}: AddMemberModalViewProps): ReactElement => {
  return (
    <ModalDialog open onClose={onClose} dialogTitle="Add member" hideChainIndicator>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <form onSubmit={onSubmit}>
          <div className="overflow-visible px-6 py-4">
            <Typography variant="paragraph" className="mb-4">
              Invite a member by email or wallet address.
            </Typography>

            <div className="flex flex-col gap-8">
              {memberInfoForm}

              {addMemberInput}
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertSeverityIcon variant="destructive" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogActions
            className="px-6 pb-6"
            onCancel={onClose}
            cancelTestId="cancel-btn"
            confirmType="submit"
            confirmLabel="Add member"
            confirmTestId="add-member-modal-button"
            confirmDisabled={!isValid}
            confirmLoading={isSubmitting}
          />
        </form>
      </div>
    </ModalDialog>
  )
}
