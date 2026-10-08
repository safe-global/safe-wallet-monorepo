import { useDarkMode } from '@/hooks/useDarkMode'
import { Controller, FormProvider, useForm } from 'react-hook-form'
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
import { isElevationRequiredError } from '@/features/oidc-auth/utils/elevation'
import { AddContactDialogView } from '@views/features/spaces/components/SpaceAddressBook/AddContactDialogView'

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
  /** Defaults to "Add contact". */
  triggerLabel?: string
  /** Defaults to "Add contact". */
  dialogTitle?: string
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
  submitLabel,
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

      if (isElevationRequiredError(result.error)) return
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
    <FormProvider {...methods}>
      <AddContactDialogView
        open={open}
        onOpen={handleOpen}
        onClose={handleClose}
        triggerLabel={triggerLabel}
        dialogTitle={dialogTitle}
        submitLabel={submitLabel}
        intro={intro}
        isDarkMode={isDarkMode}
        onSubmit={onSubmit}
        error={error}
        hasNetworksError={!!errors.networks}
        confirmDisabled={!formState.isValid || isSubmitting}
        isSubmitting={isSubmitting}
        renderNameInput={(props) => (
          <NameInput
            {...props}
            validateCharset={validateCharset}
            minLength={validateCharset ? NAME_MIN_LENGTH : undefined}
            maxLength={validateCharset ? ADDRESS_BOOK_NAME_MAX_LENGTH : undefined}
          />
        )}
        renderAddressInput={(props) => <AddressInput {...props} showPrefix={false} chain={ensChain} />}
        renderNetworksInput={(props) => (
          <Controller
            name="networks"
            control={control}
            render={({ field }) => <NetworkMultiSelectorInput {...props} value={field.value || []} />}
            rules={{ required: true }}
          />
        )}
      />
    </FormProvider>
  )
}

export default AddContactDialog
