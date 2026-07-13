import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import ModalDialog from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'
import { useState, type ReactNode } from 'react'
import AddressInput from '@/components/common/AddressInput'
import NameInput from '@/components/common/NameInput'
import { ADDRESS_BOOK_NAME_MAX_LENGTH, NAME_MIN_LENGTH, sanitizeName } from '@safe-global/utils/validation/names'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import NetworkMultiSelectorInput from '@/components/common/NetworkSelector/NetworkMultiSelectorInput'
import useChains from '@/hooks/useChains'
import { DEFAULT_MAINNET_CHAIN_ID } from '@/config/constants'
import { useCurrentSpaceId } from '@/features/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'

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
  validateCharset?: boolean
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
  validateCharset = false,
}: AddContactDialogProps) => {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { configs: allNetworks } = useChains()
  const dispatch = useAppDispatch()
  const spaceId = useCurrentSpaceId()
  const isDarkMode = useDarkMode()

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
      name: validateCharset ? sanitizeName(data.name) : data.name,
      address: data.address,
      chainIds: data.networks.map((network) => network.chainId),
    }

    try {
      setIsSubmitting(true)
      onSubmitStart?.()

      const result = await submit(item, spaceId ?? '')

      if (result.error) {
        const message = getRtkQueryErrorMessage(result.error as FetchBaseQueryError | SerializedError)
        setError(message)
        dispatch(showNotification({ message, variant: 'error', groupKey: `${successGroupKey}-error` }))
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
    } catch (error) {
      const message = getRtkQueryErrorMessage(error as FetchBaseQueryError | SerializedError)
      setError(message)
      dispatch(showNotification({ message, variant: 'error', groupKey: `${successGroupKey}-error` }))
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <>
      <Button size="action" onClick={handleOpen}>
        <Plus className="size-4 mr-1 text-green-500" />
        {triggerLabel}
      </Button>
      <ModalDialog open={open} onClose={handleClose} dialogTitle={dialogTitle} hideChainIndicator>
        <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
          <FormProvider {...methods}>
            <form onSubmit={onSubmit}>
              <div className="px-6 py-4">
                <div className="flex flex-col gap-6">
                  {intro && <p className="text-muted-foreground text-sm">{intro}</p>}

                  <NameInput
                    name="name"
                    label="Name"
                    required
                    validateCharset={validateCharset}
                    minLength={validateCharset ? NAME_MIN_LENGTH : undefined}
                    maxLength={validateCharset ? ADDRESS_BOOK_NAME_MAX_LENGTH : undefined}
                  />
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
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>

              <DialogActions
                className="p-4 pt-0"
                onCancel={handleClose}
                cancelTestId="cancel-btn"
                confirmType="submit"
                confirmLabel={submitLabel}
                confirmDisabled={!formState.isValid || isSubmitting}
                confirmLoading={isSubmitting}
              />
            </form>
          </FormProvider>
        </div>
      </ModalDialog>
    </>
  )
}

export default AddContactDialog
