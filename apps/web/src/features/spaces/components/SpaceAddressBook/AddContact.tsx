import { Alert, DialogActions, Stack, Button, DialogContent, Typography, CircularProgress, Box } from '@mui/material'
import PlusIcon from '@/public/images/common/plus.svg'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import ModalDialog from '@/components/common/ModalDialog'
import { useState } from 'react'
import AddressInput from '@/components/common/AddressInput'
import NameInput from '@/components/common/NameInput'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import NetworkMultiSelectorInput from '@/components/common/NetworkSelector/NetworkMultiSelectorInput'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'

export type ContactField = {
  name: string
  address: string
  networks: ChainInfo[]
}

const defaultValues = {
  name: '',
  address: '',
  networks: [],
}

const AddContact = () => {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const onSubmit = handleSubmit((data) => {
    try {
      // Todo: handle submit when endpoint is ready
      setIsSubmitting(true)
      trackEvent({ ...SPACE_EVENTS.ADD_ADDRESS_SUBMIT })
      console.log(data)
      setOpen(false)
      reset(defaultValues)
    } catch (error) {
      // Todo: handle
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <>
      <Button variant="contained" startIcon={<PlusIcon />} onClick={handleOpen}>
        Add contact
      </Button>
      <ModalDialog open={open} onClose={handleClose} dialogTitle="Add contact" hideChainIndicator>
        <FormProvider {...methods}>
          <form onSubmit={onSubmit}>
            <DialogContent sx={{ py: 2 }}>
              <Stack spacing={3}>
                <NameInput name="name" label="Name" required />

                <AddressInput name="address" label="Address" required showPrefix={false} />

                <Box>
                  <Typography variant="h5" fontWeight={700} display="inline-flex" alignItems="center" gap={1} mb={1}>
                    Select networks
                  </Typography>
                  <Typography variant="body2" mb={2}>
                    Add contact on all networks or only on specific ones of your choice.{' '}
                  </Typography>
                  <Controller
                    name="networks"
                    control={control}
                    defaultValue={[]}
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
              <Button type="submit" variant="contained" disabled={!formState.isValid} disableElevation>
                {isSubmitting ? <CircularProgress size={20} /> : 'Add contact'}
              </Button>
            </DialogActions>
          </form>
        </FormProvider>
      </ModalDialog>
    </>
  )
}

export default AddContact
