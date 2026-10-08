import type { FormEventHandler, ReactNode } from 'react'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { cn } from '@/utils/cn'
import ModalDialog from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'

/** Copy of the local (browser-only) contact dialog. */
export const LOCAL_CONTACT_COPY = {
  intro:
    'This contact is stored locally in this browser. You can propose adding it to the shared Workspace address book later.',
  successMessage: 'Contact added',
}

export type ContactNameInputSlotProps = { name: 'name'; label: string; required: true; inputSize: 'hero' }
export type ContactAddressInputSlotProps = { name: 'address'; label: string; required: true }
export type ContactNetworksInputSlotProps = {
  name: 'networks'
  showSelectAll: true
  error: boolean
  helperText: string
}

export type AddContactDialogViewProps = {
  open: boolean
  onOpen: () => void
  onClose: () => void
  triggerLabel?: string
  dialogTitle?: string
  submitLabel?: string
  intro?: ReactNode
  isDarkMode: boolean
  onSubmit: FormEventHandler<HTMLFormElement>
  error?: string
  hasNetworksError: boolean
  confirmDisabled: boolean
  isSubmitting: boolean
  renderNameInput: (props: ContactNameInputSlotProps) => ReactNode
  renderAddressInput: (props: ContactAddressInputSlotProps) => ReactNode
  renderNetworksInput: (props: ContactNetworksInputSlotProps) => ReactNode
}

export const AddContactDialogView = ({
  open,
  onOpen,
  onClose,
  triggerLabel = 'Add contact',
  dialogTitle = 'Add contact',
  submitLabel = 'Add contact',
  intro,
  isDarkMode,
  onSubmit,
  error,
  hasNetworksError,
  confirmDisabled,
  isSubmitting,
  renderNameInput,
  renderAddressInput,
  renderNetworksInput,
}: AddContactDialogViewProps) => (
  <>
    <Button size="action" onClick={onOpen}>
      <Plus className="size-4 mr-1 text-green-500" />
      {triggerLabel}
    </Button>
    <ModalDialog open={open} onClose={onClose} dialogTitle={dialogTitle} hideChainIndicator>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <form onSubmit={onSubmit}>
          <div className="px-6 py-4">
            <div className="flex flex-col gap-6">
              {intro && <p className="text-muted-foreground text-sm">{intro}</p>}

              {/* `hero` (66px) to match the AddressInput below, whose wrapper is min-height
                  66px — the default h-9 left the two fields visibly uneven. */}
              {renderNameInput({ name: 'name', label: 'Name', required: true, inputSize: 'hero' })}
              {renderAddressInput({ name: 'address', label: 'Address or ENS', required: true })}

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
            confirmType="submit"
            confirmLabel={submitLabel}
            confirmDisabled={confirmDisabled}
            confirmLoading={isSubmitting}
          />
        </form>
      </div>
    </ModalDialog>
  </>
)
