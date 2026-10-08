import type { FormEvent, ReactElement, ReactNode } from 'react'
import ModalDialog from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'
import { Typography } from '@/components/ui/typography'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { cn } from '@/utils/cn'
import { PRIVACY_URL } from '@safe-global/utils/config/constants'
import ExternalLink from '@/components/common/ExternalLink'

export type AcceptInviteDialogViewProps = {
  onClose: () => void
  isDarkMode: boolean
  onSubmit: (e?: FormEvent<HTMLFormElement>) => void
  renderNameInput: (props: { 'data-testid': string; label: string }) => ReactNode
  error?: string
  isValid: boolean
  isSubmitting: boolean
}

export function AcceptInviteDialogView({
  onClose,
  isDarkMode,
  onSubmit,
  renderNameInput,
  error,
  isValid,
  isSubmitting,
}: AcceptInviteDialogViewProps): ReactElement {
  return (
    <ModalDialog open onClose={onClose} dialogTitle="Accept invite" hideChainIndicator>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <form onSubmit={onSubmit}>
          <div className="px-6 py-4">
            <div className="mb-4">{renderNameInput({ 'data-testid': 'invite-name-input', label: 'Name' })}</div>
            <Typography variant="paragraph-small" color="muted">
              How is my data processed? Read our <ExternalLink href={PRIVACY_URL}>privacy policy</ExternalLink>
            </Typography>

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
            confirmLabel="Accept invite"
            confirmTestId="confirm-accept-invite-button"
            confirmDisabled={!isValid}
            confirmLoading={isSubmitting}
          />
        </form>
      </div>
    </ModalDialog>
  )
}
