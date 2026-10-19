import { useState, type ReactElement, type BaseSyntheticEvent } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import AddressInput from '@/components/common/AddressInput'
import DialogActions from '@/components/common/DialogActions'
import ModalDialog from '@/components/common/ModalDialog'
import NameInput from '@/components/common/NameInput'
import SimilarityConfirmDialog from '@/components/common/TrustedSafesModal/SimilarityConfirmDialog'
import { Alert, AlertDescription, AlertSeverityIcon } from '@safe-global/views/components/ui/alert'
import useChainId from '@/hooks/useChainId'
import { useAppDispatch } from '@/store'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { useChain } from '@/hooks/useChains'
import { sanitizeName } from '@safe-global/utils/validation/names'
import { useUpsertWorkspaceSafeName, useWorkspaceAddressBookLabel, type AddressBookWriteScope } from '@/features/spaces'
import { SimilarSavedAddressNotice, useAddressPoisoningCheck } from '@/features/address-poisoning'
import {
  ADDRESS_POISONING_EVENTS,
  LookalikeWarningLocation,
  MixpanelEventParams,
  trackEvent,
} from '@/services/analytics'
import { useTrackOnce } from '@/services/analytics/useTrackOnce'

export type AddressEntry = {
  name: string
  address: string
}

const LOOKALIKE_TRACKING = { [MixpanelEventParams.LOCATION]: LookalikeWarningLocation.ADDRESS_BOOK_ENTRY }

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
  // A look-alike entry waiting for the user to confirm it in the similarity dialog.
  const [pendingEntry, setPendingEntry] = useState<AddressEntry>()

  const methods = useForm<AddressEntry>({
    defaultValues,
    mode: 'onChange',
  })

  const { handleSubmit, formState, watch } = methods

  const address = watch('address')
  const similar = useAddressPoisoningCheck(address)
  useTrackOnce(ADDRESS_POISONING_EVENTS.WARNING_SHOWN, LOOKALIKE_TRACKING, !!similar)

  const save = async (data: AddressEntry) => {
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
  }

  // `save` is async, so a rejection would otherwise escape as an unhandled rejection.
  const onSaveError = () => {
    setIsSubmitting(false)
    setError('Something went wrong. Please try again.')
  }

  const submitCallback = handleSubmit(async (data: AddressEntry) => {
    if (similar) return setPendingEntry(data)
    await save(data)
  })

  const onSubmit = (e: BaseSyntheticEvent) => {
    e.stopPropagation()
    submitCallback(e).catch(onSaveError)
  }

  const onConfirmLookalike = () => {
    if (!pendingEntry) return
    trackEvent(ADDRESS_POISONING_EVENTS.WARNING_CONTINUED, LOOKALIKE_TRACKING)
    setPendingEntry(undefined)
    save(pendingEntry).catch(onSaveError)
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
                This name is saved to {workspaceLabel} and is visible to everyone in the Workspace.
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

            {similar && (
              <div className="mt-4">
                <SimilarSavedAddressNotice subject="This address" enteredAddress={address} similar={similar} />
              </div>
            )}

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

      <SimilarityConfirmDialog
        open={!!pendingEntry}
        safe={{ address: pendingEntry?.address ?? address }}
        description={`This address is similar to ${similar?.source === 'accounts' ? 'a Safe in your accounts' : 'an address in your address book'}. This could indicate an address poisoning attack.`}
        addressLabel="Address"
        hint="Verify the full address carefully. Continue only if you recognize this address."
        onConfirm={onConfirmLookalike}
        onCancel={() => setPendingEntry(undefined)}
        className={className}
        overlayClassName={overlayClassName}
      />
    </ModalDialog>
  )
}

export default EntryDialog
