import { Alert, DialogActions, Button, DialogContent } from '@mui/material'
import { Button as ShadcnButton } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Plus } from 'lucide-react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import ModalDialog from '@/components/common/ModalDialog'
import { useState, type ReactNode } from 'react'
import AddressInput from '@/components/common/AddressInput'
import NameInput from '@/components/common/NameInput'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import NetworkMultiSelectorInput from '@/components/common/NetworkSelector/NetworkMultiSelectorInput'
import useChains from '@/hooks/useChains'
import { DEFAULT_MAINNET_CHAIN_ID } from '@/config/constants'
import { useCurrentSpaceId } from '@/features/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'

export type ContactField = {
  name: string
  address: string
  networks: Chain[]
}

export type AddContactItem = {
  name: string
  address: string
  chainIds: string[]
}

type AddContactDialogProps = {
  triggerLabel: string
  dialogTitle: string
  submitLabel?: string
  intro?: ReactNode
  successMessage: string
  successGroupKey: string
  submit: (item: AddContactItem, spaceId: string) => Promise<{ error?: unknown }>
  onSubmitStart?: () => void
  onSuccess?: () => void
}

const AddContactDialog = ({
  triggerLabel,
  dialogTitle,
  submitLabel = 'Add contact',
  intro,
  successMessage,
  successGroupKey,
  submit,
  onSubmitStart,
  onSuccess,
}: AddContactDialogProps) => {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { configs: allNetworks } = useChains()
  const dispatch = useAppDispatch()
  const spaceId = useCurrentSpaceId()

  // Contacts are chain-agnostic, so resolve ENS names on mainnet regardless of the connected chain
  const ensChain = allNetworks.find((chain) => chain.chainId === String(DEFAULT_MAINNET_CHAIN_ID))

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

    const item: AddContactItem = {
      name: data.name,
      address: data.address,
      chainIds: data.networks.map((network) => network.chainId),
    }

    try {
      setIsSubmitting(true)
      onSubmitStart?.()

      const result = await submit(item, spaceId ?? '')

      if (result.error) {
        setError('Something went wrong. Please try again.')
        return
      }

      onSuccess?.()

      dispatch(
        showNotification({
          message: successMessage,
          variant: 'success',
          groupKey: successGroupKey,
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
      <ShadcnButton size="lg" className="px-4 py-0" onClick={handleOpen}>
        <Plus className="size-4 mr-1 text-green-500" />
        {triggerLabel}
      </ShadcnButton>
      <ModalDialog open={open} onClose={handleClose} dialogTitle={dialogTitle} hideChainIndicator>
        <FormProvider {...methods}>
          <form onSubmit={onSubmit}>
            <DialogContent sx={{ py: 2 }}>
              <div className="flex flex-col gap-6">
                {intro && <p className="text-muted-foreground text-sm">{intro}</p>}

                <NameInput name="name" label="Name" required />
                <AddressInput name="address" label="Address or ENS" required showPrefix={false} chain={ensChain} />

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
                {isSubmitting ? <Spinner className="size-5" /> : submitLabel}
              </Button>
            </DialogActions>
          </form>
        </FormProvider>
      </ModalDialog>
    </>
  )
}

export default AddContactDialog
