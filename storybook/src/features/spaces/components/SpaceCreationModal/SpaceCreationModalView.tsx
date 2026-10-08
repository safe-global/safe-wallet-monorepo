import type { FormEventHandler, ReactElement, ReactNode } from 'react'
import SpaceIcon from '@/public/images/spaces/space.svg'
import ModalDialog from '@/components/common/ModalDialog'
import { PRIVACY_URL } from '@safe-global/utils/config/constants'
import ExternalLink from '@/components/common/ExternalLink'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import DialogActions from '@/components/common/DialogActions'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

export type SpaceCreationModalViewProps = {
  isDarkMode: boolean
  error?: string
  isValid: boolean
  isSubmitting: boolean
  onClose: () => void
  onSubmit: FormEventHandler<HTMLFormElement>
  renderNameInput: (label: string) => ReactNode
}

export function SpaceCreationModalView({
  isDarkMode,
  error,
  isValid,
  isSubmitting,
  onClose,
  onSubmit,
  renderNameInput,
}: SpaceCreationModalViewProps): ReactElement {
  return (
    <ModalDialog
      open
      onClose={onClose}
      dialogTitle={
        <>
          <SpaceIcon className="mr-2 size-6 fill-none" />
          Create Workspace
        </>
      }
      hideChainIndicator
    >
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <form onSubmit={onSubmit}>
          <div className="px-6 py-4">
            <div className="mb-4">{renderNameInput('Name')}</div>
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
            className="p-4 pt-0"
            onCancel={onClose}
            cancelTestId="cancel-btn"
            confirmLabel="Create Workspace"
            confirmType="submit"
            confirmDisabled={!isValid || isSubmitting}
            confirmLoading={isSubmitting}
            confirmTestId="create-space-modal-button"
          />
        </form>
      </div>
    </ModalDialog>
  )
}
