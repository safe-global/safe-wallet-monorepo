import type { BaseSyntheticEvent, ReactElement, ReactNode } from 'react'

import ModalDialog from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'

export type EntryNameInputProps = {
  'data-testid': string
  label: string
  autoFocus: boolean
  name: 'name'
  required: boolean
  inputSize: 'hero'
}

export type EntryAddressInputProps = {
  name: 'address'
  label: string
  variant: 'outlined'
  fullWidth: boolean
  required: boolean
  disabled: boolean
}

export type EntryDialogViewProps = {
  isEdit: boolean
  isWorkspaceScope: boolean
  workspaceLabel: string
  hideChainIndicator?: boolean
  chainId?: string
  modalClassName?: string
  modalOverlayClassName?: string
  disableAddressInput: boolean
  error?: string
  isValid: boolean
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (e: BaseSyntheticEvent) => void
  renderNameInput: (props: EntryNameInputProps) => ReactNode
  renderAddressInput: (props: EntryAddressInputProps) => ReactNode
}

export function EntryDialogView({
  isEdit,
  isWorkspaceScope,
  workspaceLabel,
  hideChainIndicator,
  chainId,
  modalClassName,
  modalOverlayClassName,
  disableAddressInput,
  error,
  isValid,
  isSubmitting,
  onClose,
  onSubmit,
  renderNameInput,
  renderAddressInput,
}: EntryDialogViewProps): ReactElement {
  return (
    <ModalDialog
      data-testid="entry-dialog"
      open
      onClose={onClose}
      dialogTitle={isEdit ? 'Edit entry' : 'Create entry'}
      hideChainIndicator={hideChainIndicator}
      chainId={chainId}
      className={modalClassName}
      overlayClassName={modalOverlayClassName}
    >
      <form onSubmit={onSubmit}>
        <div className="p-6">
          {isWorkspaceScope && (
            <p data-testid="entry-scope-notice" className="text-muted-foreground mb-4 text-sm">
              This name is saved to {workspaceLabel} and is visible to everyone in the Workspace.
            </p>
          )}

          <div className="mb-4">
            {/* `hero` (66px) matches the 66px min-height of the AddressInput wrapper below. */}
            {renderNameInput({
              'data-testid': 'name-input',
              label: 'Name',
              autoFocus: true,
              name: 'name',
              required: true,
              inputSize: 'hero',
            })}
          </div>

          <div>
            {renderAddressInput({
              name: 'address',
              label: 'Address',
              variant: 'outlined',
              fullWidth: true,
              required: true,
              disabled: disableAddressInput,
            })}
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertSeverityIcon variant="destructive" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogActions
          onCancel={onClose}
          cancelTestId="cancel-btn"
          confirmLabel="Save"
          confirmType="submit"
          confirmTestId="save-btn"
          confirmDisabled={!isValid}
          confirmLoading={isSubmitting}
          className="p-6 pt-2"
        />
      </form>
    </ModalDialog>
  )
}
