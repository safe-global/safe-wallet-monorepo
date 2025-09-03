import { Alert, DialogActions, Stack, Button, DialogContent, Typography, CircularProgress, Box } from '@mui/material'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import ModalDialog from '@/components/common/ModalDialog'
import { useState, useMemo } from 'react'
import AddressInputReadOnly from '@/components/common/AddressInputReadOnly'
import NameInput from '@/components/common/NameInput'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import NetworkMultiSelectorInput from '@/components/common/NetworkSelector/NetworkMultiSelectorInput'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import useChains from '@/hooks/useChains'
import type { ContactField } from './AddContact'
import {
  type SpaceAddressBookItemDto,
  useAddressBooksUpsertAddressBookItemsV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { useCurrentSpaceId } from '@/features/spaces/hooks/useCurrentSpaceId'
import { useAppDispatch } from '@/store'

type EditContactDialogProps = {
  entry: SpaceAddressBookItemDto
  onClose: () => void
}

const EditContactDialog = ({ entry, onClose }: EditContactDialogProps) => {
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { configs } = useChains()
  const dispatch = useAppDispatch()
  const spaceId = useCurrentSpaceId()
  const [upsertAddressBook] = useAddressBooksUpsertAddressBookItemsV1Mutation()

  const defaultNetworks = entry.chainIds
    .map((chainId) => {
      return configs.find((chain) => chain.chainId === chainId) as ChainInfo
    })
    .filter(Boolean)

  const defaultValues = {
    name: entry.name,
    address: entry.address,
    networks: defaultNetworks,
  }

  const methods = useForm<ContactField>({
    mode: 'onChange',
    defaultValues,
  })

  const { handleSubmit, formState, control, reset, watch } = methods

  const { errors } = formState

  // Watch for changes in name and networks
  const watchedName = watch('name')
  const watchedNetworks = watch('networks')

  // Check if any changes were made
  const hasChanges = useMemo(() => {
    const nameChanged = watchedName !== entry.name

    const originalChainIds = entry.chainIds.toSorted()
    const currentChainIds = watchedNetworks.map((network) => network.chainId).sort()
    const networksChanged =
      originalChainIds.length !== currentChainIds.length ||
      originalChainIds.some((id, index) => id !== currentChainIds[index])

    return nameChanged || networksChanged
  }, [watchedName, watchedNetworks, entry.name, entry.chainIds])

  const handleClose = () => {
    reset(defaultValues)
    setError('')
    onClose()
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
      trackEvent({ ...SPACE_EVENTS.EDIT_ADDRESS_SUBMIT })

      const result = await upsertAddressBook({
        spaceId: Number(spaceId),
        upsertAddressBookItemsDto: { items: [addressBookItem] },
      })

      if (result.error) {
        setError('Something went wrong. Please try again.')
        return
      }

      dispatch(
        showNotification({
          message: `Updated contact`,
          variant: 'success',
          groupKey: 'update-contact-success',
        }),
      )

      handleClose()
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <ModalDialog open={true} onClose={handleClose} dialogTitle="Edit contact" hideChainIndicator>
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <DialogContent sx={{ py: 2 }}>
            <Typography mb={2}>Edit contact details. Anyone in the space can see it.</Typography>
            <Stack spacing={3}>
              <Box pt={1}>
                <AddressInputReadOnly address={entry.address} chainId={entry.chainIds[0]} />
              </Box>

              <NameInput name="name" label="Name" required />

              <Box>
                <Typography variant="h5" fontWeight={700} display="inline-flex" alignItems="center" gap={1} mt={2}>
                  Select networks
                </Typography>
                <Typography variant="body2" mb={1}>
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
            <Button
              type="submit"
              variant="contained"
              disabled={!formState.isValid || !hasChanges || isSubmitting}
              disableElevation
            >
              {isSubmitting ? <CircularProgress size={20} /> : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </ModalDialog>
  )
}

export default EditContactDialog
