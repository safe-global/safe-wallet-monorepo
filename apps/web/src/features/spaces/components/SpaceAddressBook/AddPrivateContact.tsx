import { Alert, DialogActions, Stack, Button, DialogContent, Typography, CircularProgress, Box } from '@mui/material'
import { Button as ShadcnButton } from '@/components/ui/button'
import PlusIcon from '@/public/images/common/plus.svg'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import ModalDialog from '@/components/common/ModalDialog'
import { useState } from 'react'
import AddressInput from '@/components/common/AddressInput'
import NameInput from '@/components/common/NameInput'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import useChains from '@/hooks/useChains'
import { useUpsertPrivateAddressBookMutation } from '@safe-global/store/gateway/privateAddressBookApi'
import { useCurrentSpaceId } from '@/features/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import NetworkMultiSelectorInput from '@/components/common/NetworkSelector/NetworkMultiSelectorInput'

type ContactField = {
  name: string
  address: string
  networks: Chain[]
}

const AddPrivateContact = () => {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { configs: allNetworks } = useChains()
  const dispatch = useAppDispatch()
  const spaceId = useCurrentSpaceId()
  const [upsertPrivate] = useUpsertPrivateAddressBookMutation()

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

    const item = {
      name: data.name,
      address: data.address,
      chainIds: data.networks.map((network) => network.chainId),
    }

    try {
      setIsSubmitting(true)

      const result = await upsertPrivate({
        spaceId: Number(spaceId),
        body: { items: [item] },
      })

      if (result.error) {
        setError('Something went wrong. Please try again.')
        return
      }

      dispatch(
        showNotification({
          message: 'Private contact added',
          variant: 'success',
          groupKey: 'add-private-contact-success',
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
      <ShadcnButton size="sm" variant="outline" onClick={handleOpen}>
        <PlusIcon />
        Add contact
      </ShadcnButton>
      <ModalDialog open={open} onClose={handleClose} dialogTitle="Add private contact" hideChainIndicator>
        <FormProvider {...methods}>
          <form onSubmit={onSubmit}>
            <DialogContent sx={{ py: 2 }}>
              <Stack spacing={3}>
                <Typography variant="body2" color="text.secondary">
                  This contact will be visible only to you. You can request to add it to the shared workspace address
                  book later.
                </Typography>

                <NameInput name="name" label="Name" required />

                <AddressInput name="address" label="Address" required showPrefix={false} />

                <Box>
                  <Typography variant="h5" fontWeight={700} display="inline-flex" alignItems="center" gap={1} mb={1}>
                    Select networks
                  </Typography>
                  <Typography variant="body2" mb={2}>
                    Add contact on all networks or only on specific ones of your choice.
                  </Typography>
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
                </Box>
              </Stack>

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
                {isSubmitting ? <CircularProgress size={20} /> : 'Add contact'}
              </Button>
            </DialogActions>
          </form>
        </FormProvider>
      </ModalDialog>
    </>
  )
}

export default AddPrivateContact
