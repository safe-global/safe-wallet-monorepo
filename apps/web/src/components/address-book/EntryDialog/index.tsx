import type { ReactElement, BaseSyntheticEvent } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import AddressInput from '@/components/common/AddressInput'
import DialogActions from '@/components/common/DialogActions'
import ModalDialog from '@/components/common/ModalDialog'
import NameInput from '@/components/common/NameInput'
import useChainId from '@/hooks/useChainId'
import { useAppDispatch } from '@/store'
import { upsertAddressBookEntries } from '@/store/addressBookSlice'
import { useChain } from '@/hooks/useChains'

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
  className,
  overlayClassName,
}: {
  handleClose: () => void
  defaultValues?: AddressEntry
  disableAddressInput?: boolean
  chainIds?: string[]
  currentChainId?: string
  /** Opened from inside another overlay? Pass `z-[var(--z-nested-overlay)]` to both of these. */
  className?: string
  overlayClassName?: string
}): ReactElement {
  const chainId = useChainId()
  const actualChainId = currentChainId ?? chainId
  const currentChain = useChain(actualChainId)
  const dispatch = useAppDispatch()

  const methods = useForm<AddressEntry>({
    defaultValues,
    mode: 'onChange',
  })

  const { handleSubmit, formState } = methods

  const submitCallback = handleSubmit((data: AddressEntry) => {
    dispatch(upsertAddressBookEntries({ ...data, chainIds: chainIds ?? [actualChainId], notify: true }))
    handleClose()
  })

  const onSubmit = (e: BaseSyntheticEvent) => {
    e.stopPropagation()
    submitCallback(e)
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
          </div>

          <DialogActions
            onCancel={handleClose}
            cancelTestId="cancel-btn"
            confirmLabel="Save"
            confirmType="submit"
            confirmTestId="save-btn"
            confirmDisabled={!formState.isValid}
            className="p-2"
          />
        </form>
      </FormProvider>
    </ModalDialog>
  )
}

export default EntryDialog
