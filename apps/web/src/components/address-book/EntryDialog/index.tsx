import type { ComponentProps, ReactElement, BaseSyntheticEvent } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import AddressInput from '@/components/common/AddressInput'
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
  sx,
}: {
  handleClose: () => void
  defaultValues?: AddressEntry
  disableAddressInput?: boolean
  chainIds?: string[]
  currentChainId?: string
  sx?: ComponentProps<typeof ModalDialog>['sx']
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
    dispatch(upsertAddressBookEntries({ ...data, chainIds: chainIds ?? [actualChainId] }))
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
      sx={sx}
    >
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <div className="p-6">
            <div className="mb-4">
              <NameInput data-testid="name-input" label="Name" autoFocus name="name" required />
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

          <div className="flex items-center justify-end gap-2 p-2">
            <Button variant="ghost" data-testid="cancel-btn" onClick={handleClose}>
              Cancel
            </Button>
            <Button data-testid="save-btn" type="submit" disabled={!formState.isValid}>
              Save
            </Button>
          </div>
        </form>
      </FormProvider>
    </ModalDialog>
  )
}

export default EntryDialog
