import type { FormEventHandler, ReactNode } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import ModalDialog from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'
import AddressInputReadOnly from '@views/components/common/AddressInputReadOnly'
import { cn } from '@/utils/cn'
import type { ContactNameInputSlotProps, ContactNetworksInputSlotProps } from './AddContactDialogView'

export type EditContactDialogViewProps = {
  address: string
  chainId?: string
  onClose: () => void
  isDarkMode: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
  error?: string
  hasNetworksError: boolean
  confirmDisabled: boolean
  isSubmitting: boolean
  renderNameInput: (props: ContactNameInputSlotProps) => ReactNode
  renderNetworksInput: (props: ContactNetworksInputSlotProps) => ReactNode
}

export const EditContactDialogView = ({
  address,
  chainId,
  onClose,
  isDarkMode,
  onSubmit,
  error,
  hasNetworksError,
  confirmDisabled,
  isSubmitting,
  renderNameInput,
  renderNetworksInput,
}: EditContactDialogViewProps) => (
  <ModalDialog open={true} onClose={onClose} dialogTitle="Edit contact" hideChainIndicator>
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <form onSubmit={onSubmit}>
        <div className="px-6 py-4">
          <Typography className="mb-4">Edit contact details. Anyone in the Workspace can see it.</Typography>
          <div className="flex flex-col gap-6">
            <div className="pt-2">
              <AddressInputReadOnly address={address} chainId={chainId} />
            </div>

            {/* `hero` (66px) to match the AddressInputReadOnly above, whose wrapper is
                min-height 66px — the default h-9 left the two fields visibly uneven. */}
            {renderNameInput({ name: 'name', label: 'Name', required: true, inputSize: 'hero' })}

            <div>
              <p className="mb-1 inline-flex items-center gap-1 text-sm font-bold">Select networks</p>
              <p className="text-muted-foreground mb-2 text-sm">
                Add contact on all networks or only on specific ones of your choice.
              </p>
              {renderNetworksInput({
                name: 'networks',
                showSelectAll: true,
                error: hasNetworksError,
                helperText: hasNetworksError ? 'Select at least one network' : '',
              })}
            </div>
          </div>

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
          confirmLabel="Save"
          confirmType="submit"
          confirmDisabled={confirmDisabled}
          confirmLoading={isSubmitting}
        />
      </form>
    </div>
  </ModalDialog>
)
