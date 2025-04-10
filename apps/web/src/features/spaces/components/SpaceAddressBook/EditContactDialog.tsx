import { Alert, DialogActions, Stack, Button, DialogContent, Typography, CircularProgress, Box } from '@mui/material'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import ModalDialog from '@/components/common/ModalDialog'
import { useState, useMemo } from 'react'
import AddressInput from '@/components/common/AddressInput'
import NameInput from '@/components/common/NameInput'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import NetworkMultiSelectorInput from '@/components/common/NetworkSelector/NetworkMultiSelectorInput'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import type { SpaceAddressBookEntry } from '../../types'
import useChains from '@/hooks/useChains'
import type { ContactField } from './AddContact'

type EditContactDialogProps = {
  entry: SpaceAddressBookEntry
  onClose: () => void
}

// TODO: Replace with actual CGW API calls
const createAddressBookEntry = async (address: string, name: string, chainId: string) => {
  console.log('CREATE:', { address, name, chainId })
  return
}

const updateAddressBookEntry = async (id: string, name: string) => {
  console.log('UPDATE:', { id, name })
  return
}

const deleteAddressBookEntry = async (id: string, chainId: string) => {
  console.log('DELETE:', { id, chainId })
  return
}

const EditContactDialog = ({ entry, onClose }: EditContactDialogProps) => {
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { configs } = useChains()

  const defaultNetworks = entry.networks
    .map((network) => {
      return configs.find((chain) => chain.chainId === network.chainId) as ChainInfo
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

    const originalChainIds = entry.networks.map((network) => network.chainId).sort()
    const currentChainIds = watchedNetworks.map((network) => network.chainId).sort()
    const networksChanged =
      originalChainIds.length !== currentChainIds.length ||
      originalChainIds.some((id, index) => id !== currentChainIds[index])

    return nameChanged || networksChanged
  }, [watchedName, watchedNetworks, entry.name, entry.networks])

  const handleClose = () => {
    reset(defaultValues)
    setError('')
    onClose()
  }

  const onSubmit = handleSubmit(async (data) => {
    try {
      setIsSubmitting(true)
      trackEvent({ ...SPACE_EVENTS.ADD_ADDRESS_SUBMIT })

      const selectedChainIds = data.networks.map((network) => network.chainId)
      const originalChainIds = entry.networks.map((network) => network.chainId)

      // Determine which networks need to be created, updated, or deleted
      const toCreate = selectedChainIds.filter((chainId) => !originalChainIds.includes(chainId))
      const toDelete = originalChainIds.filter((chainId) => !selectedChainIds.includes(chainId))
      // Only update if the name has changed
      const nameHasChanged = data.name !== entry.name
      const toUpdate = nameHasChanged ? selectedChainIds.filter((chainId) => originalChainIds.includes(chainId)) : []

      const createPromises = toCreate.map((chainId) => createAddressBookEntry(data.address, data.name, chainId))
      const updatePromises = toUpdate.map((chainId) => {
        const networkEntry = entry.networks.find((network) => network.chainId === chainId)
        if (!networkEntry) return Promise.resolve(null)
        return updateAddressBookEntry(networkEntry.id, data.name)
      })
      const deletePromises = toDelete.map((chainId) => {
        const networkEntry = entry.networks.find((network) => network.chainId === chainId)
        if (!networkEntry) return Promise.resolve(true)
        return deleteAddressBookEntry(networkEntry.id, chainId)
      })

      await Promise.all([...createPromises, ...updatePromises, ...deletePromises])

      handleClose()
    } catch (error) {
      setError('Something went wrong. Please try again.')
      console.error(error)
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
              <AddressInput
                name="address"
                label="Address"
                required
                showPrefix={false}
                disabled={true}
                InputProps={{ readOnly: true }}
              />
              <NameInput name="name" label="Name" required />

              <Box>
                <Typography variant="h5" fontWeight={700} display="inline-flex" alignItems="center" gap={1} mt={2}>
                  Select Networks
                </Typography>
                <Typography variant="body2" mb={1}>
                  Choose which networks you want your address book entry to apply to.
                </Typography>
                <Controller
                  name="networks"
                  control={control}
                  render={({ field }) => (
                    <NetworkMultiSelectorInput
                      name="networks"
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
