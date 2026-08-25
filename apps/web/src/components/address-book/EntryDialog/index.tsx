import { useState, type ReactElement, type BaseSyntheticEvent } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import AddressInput from '@/components/common/AddressInput'
import DialogActions from '@/components/common/DialogActions'
import ModalDialog from '@/components/common/ModalDialog'
import NameInput from '@/components/common/NameInput'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import useChainId from '@/hooks/useChainId'
import { useAppDispatch } from '@/store'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { useChain } from '@/hooks/useChains'
import { sanitizeName } from '@safe-global/utils/validation/names'
import { useUpsertWorkspaceSafeName, useWorkspaceAddressBookLabel, type AddressBookWriteScope } from '@/features/spaces'

export type AddressEntry = {
  name: string
  address: string
}

function EntryDialog({
  handleClose,
  defaultValues = {
    name: '',
    address: '',
  },
  disableAddressInput = false,
  chainIds,
  currentChainId,
  scope = 'local',
  className,
  overlayClassName,
}: {
  handleClose: () => void
  defaultValues?: AddressEntry
  disableAddressInput?: boolean
  chainIds?: string[]
  currentChainId?: string
  scope?: AddressBookWriteScope
  /** Opened from inside another overlay? Pass `z-[var(--z-nested-overlay)]` to both of these. */
  className?: string
  overlayClassName?: string
}): ReactElement {
  const chainId = useChainId()
  const actualChainId = currentChainId ?? chainId
  const currentChain = useChain(actualChainId)
  const dispatch = useAppDispatch()
  const upsertWorkspaceName = useUpsertWorkspaceSafeName()
  const workspaceLabel = useWorkspaceAddressBookLabel()
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const methods = useForm<AddressEntry>({
    defaultValues,
    mode: 'onChange',
  })

  const { handleSubmit, formState } = methods

  const submitCallback = handleSubmit(async (data: AddressEntry) => {
    const targetChainIds = chainIds ?? [actualChainId]
    // Both address books store the same string, whichever branch runs.
    const entry = { ...data, name: sanitizeName(data.name) }

    if (scope === 'workspace') {
      setError(undefined)
      setIsSubmitting(true)
      const result = await upsertWorkspaceName({ ...entry, chainIds: targetChainIds })
      setIsSubmitting(false)
      if (result.error) return setError(result.error)
    } else {
      dispatch(upsertAddressBookEntries({ ...entry, chainIds: targetChainIds, notify: true }))
    }

    handleClose()
  })

  const onSubmit = (e: BaseSyntheticEvent) => {
    e.stopPropagation()
    // `submitCallback` is async, so a rejection here would escape as an unhandled rejection.
    submitCallback(e).catch(() => {
      setIsSubmitting(false)
      setError('Something went wrong. Please try again.')
    })
  }

  return (
    <ModalDialog
      data-testid="entry-dialog"
      open
      onClose={handleClose}
      dialogTitle={defaultValues.name ? 'Edit entry' : 'Create entry'}
      hideChainIndicator={chainIds && chainIds.length > 1}
      chainId={chainIds?.[0]}
      className={className}
      overlayClassName={overlayClassName}
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <div className="p-6">
            {scope === 'workspace' && (
              <p data-testid="entry-scope-notice" className="text-muted-foreground mb-4 text-sm">
                This name is saved to {workspaceLabel} and is visible to everyone in the workspace.
              </p>
            )}

            <div className="mb-4">
              {/* `hero` (66px) to match the AddressInput below, whose wrapper is min-height 66px —
                  the same pairing SetAddressStep already uses. The default h-9 left this field
                  noticeably shorter than the address box it sits above. */}
              <NameInput data-testid="name-input" label="Name" autoFocus name="name" required inputSize="hero" />
            </div>

            <div>
              <AddressInput
                name="address"
                label="Address"
                variant="outlined"
                fullWidth
                required
                disabled={disableAddressInput}
                chain={currentChain}
                showPrefix={!!currentChainId}
              />
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertSeverityIcon variant="destructive" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogActions
            onCancel={handleClose}
            cancelTestId="cancel-btn"
            confirmLabel="Save"
            confirmType="submit"
            confirmTestId="save-btn"
            confirmDisabled={!formState.isValid}
            confirmLoading={isSubmitting}
            className="p-6 pt-2"
          />
        </form>
      </FormProvider>
    </ModalDialog>
  )
}

export default EntryDialog
