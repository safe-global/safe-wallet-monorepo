import { Alert, AlertDescription } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import ModalDialog from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'
import { useState, useMemo } from 'react'
import AddressInputReadOnly from '@/components/common/AddressInputReadOnly'
import NameInput from '@/components/common/NameInput'
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
import { useCurrentSpaceId } from '@/features/spaces'
import { useAppDispatch } from '@/store'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'

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
  const isDarkMode = useDarkMode()
  const [upsertAddressBook] = useAddressBooksUpsertAddressBookItemsV1Mutation()

  const defaultNetworks = entry.chainIds
    .map((chainId) => {
      return configs.find((chain) => chain.chainId === chainId)
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
        spaceId: spaceId ?? '',
        upsertAddressBookItemsDto: { items: [addressBookItem] },
      })

      if (result.error) {
        setError(getRtkQueryErrorMessage(result.error as FetchBaseQueryError | SerializedError))
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
      setError(getRtkQueryErrorMessage(error as FetchBaseQueryError | SerializedError))
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <ModalDialog open={true} onClose={handleClose} dialogTitle="Edit contact" hideChainIndicator>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <FormProvider {...methods}>
          <form onSubmit={onSubmit}>
            <div className="px-6 py-4">
              <Typography className="mb-4">Edit contact details. Anyone in the workspace can see it.</Typography>
              <div className="flex flex-col gap-6">
                <div className="pt-2">
                  <AddressInputReadOnly address={entry.address} chainId={entry.chainIds[0]} />
                </div>

                <NameInput name="name" label="Name" required />

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
              confirmLabel="Save"
              confirmType="submit"
              confirmDisabled={!formState.isValid || !hasChanges}
              confirmLoading={isSubmitting}
            />
          </form>
        </FormProvider>
      </div>
    </ModalDialog>
  )
}

export default EditContactDialog
