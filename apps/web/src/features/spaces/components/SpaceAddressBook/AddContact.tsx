import { Alert, DialogActions, Button, DialogContent } from '@mui/material'
import { Button as ShadcnButton } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Plus } from 'lucide-react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import ModalDialog from '@/components/common/ModalDialog'
import { useState } from 'react'
import AddressInput from '@/components/common/AddressInput'
import NameInput from '@/components/common/NameInput'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import NetworkMultiSelectorInput from '@/components/common/NetworkSelector/NetworkMultiSelectorInput'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import useChains from '@/hooks/useChains'
import { useAddressBooksUpsertAddressBookItemsV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId, useGetSpaceAddressBook } from '@/features/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'

export type ContactField = {
  name: string
  address: string
  networks: Chain[]
}

const AddContact = ({ label = 'Add contact' }: { label?: string }) => {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { configs: allNetworks } = useChains()
  const dispatch = useAppDispatch()
  const spaceId = useCurrentSpaceId()
  const addressBookItems = useGetSpaceAddressBook()
  const [upsertAddressBook] = useAddressBooksUpsertAddressBookItemsV1Mutation()

  const defaultValues = {
    name: '',
    address: '',
    networks: allNetworks,
  }

  const methods = useForm<ContactField>({
    mode: 'onChange',
    defaultValues,
  })

  const { handleSubmit, formState, control, reset } = methods
  const { errors } = formState

  const handleClose = () => {
    setOpen(false)
    reset(defaultValues)
    setError('')
  }

  const handleOpen = () => {
    setOpen(true)
    reset(defaultValues)
    setError('')
  }

  const onSubmit = handleSubmit(async (data) => {
    setError(undefined)

    const addressBookItem = {
      name: data.name,
      address: data.address,
      chainIds: data.networks.map((network) => network.chainId),
    }

    try {
      setIsSubmitting(true)
      trackEvent({ ...SPACE_EVENTS.ADD_ADDRESS_SUBMIT })

      const result = await upsertAddressBook({
        spaceId: Number(spaceId),
        upsertAddressBookItemsDto: { items: [addressBookItem] },
      })

      if (result.error) {
        setError('Something went wrong. Please try again.')
        return
      }

      trackEvent(
        { ...SPACE_EVENTS.ADDRESS_BOOK_ENTRY_CREATED },
        { workspace_id: spaceId, entry_count_after: addressBookItems.length + 1 },
      )

      dispatch(
        showNotification({
          message: 'Added contact',
          variant: 'success',
          groupKey: 'add-contact-success',
        }),
      )

      handleClose()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <>
      <ShadcnButton size="lg" className="font-bold px-4 py-0" onClick={handleOpen}>
        <Plus className="size-4 mr-1 text-green-500" />
        {label}
      </ShadcnButton>
      <ModalDialog open={open} onClose={handleClose} dialogTitle="Add contact" hideChainIndicator>
        <FormProvider {...methods}>
          <form onSubmit={onSubmit}>
            <DialogContent sx={{ py: 2 }}>
              <div className="flex flex-col gap-6">
                <NameInput name="name" label="Name" required />
                <AddressInput name="address" label="Address" required showPrefix={false} />

                <div>
                  <p className="mb-1 inline-flex items-center gap-1 text-sm font-bold">Select networks</p>
                  <p className="text-muted-foreground mb-2 text-sm">
                    Add contact on all networks or only on specific ones of your choice.
                  </p>
                  <Controller
                    name="networks"
                    control={control}
                    render={({ field }) => (
                      <NetworkMultiSelectorInput
                        name="networks"
                        showSelectAll
                        value={field.value || []}
                        error={!!errors.networks}
                        helperText={errors.networks ? 'Select at least one network' : ''}
                      />
                    )}
                    rules={{ required: true }}
                  />
                </div>
              </div>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </DialogContent>

            <DialogActions>
              <Button data-testid="cancel-btn" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={!formState.isValid || isSubmitting} disableElevation>
                {isSubmitting ? <Spinner className="size-5" /> : 'Add contact'}
              </Button>
            </DialogActions>
          </form>
        </FormProvider>
      </ModalDialog>
    </>
  )
}

export default AddContact
