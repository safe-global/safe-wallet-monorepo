import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Typography } from '@/components/ui/typography'
import { FormProvider, useForm } from 'react-hook-form'
import ModalDialog from '@/components/common/ModalDialog'
import DialogActions from '@/components/common/DialogActions'
import { useState } from 'react'
import AddressInputReadOnly from '@/components/common/AddressInputReadOnly'
import NameInput from '@/components/common/NameInput'
import { ADDRESS_BOOK_NAME_MAX_LENGTH, NAME_MIN_LENGTH, sanitizeName } from '@safe-global/utils/validation/names'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import useChains from '@/hooks/useChains'
import {
  type SpaceAddressBookItemDto,
  useAddressBooksUpsertAddressBookItemsV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { showNotification } from '@/store/notificationsSlice'
import { useCurrentSpaceId, useWorkspaceAddressBookLabel } from '@/features/spaces'
import { useAppDispatch } from '@/store'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'
import { getContactUpdatedMessage } from '@/utils/addressBookNotifications'

type EditContactDialogProps = {
  entry: SpaceAddressBookItemDto
  onClose: () => void
}

type EditContactField = {
  name: string
}

const EditContactDialog = ({ entry, onClose }: EditContactDialogProps) => {
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { configs } = useChains()
  const dispatch = useAppDispatch()
  const spaceId = useCurrentSpaceId()
  const isDarkMode = useDarkMode()
  const workspaceAddressBookLabel = useWorkspaceAddressBookLabel()
  const [upsertAddressBook] = useAddressBooksUpsertAddressBookItemsV1Mutation()

  const defaultValues = { name: entry.name }

  const methods = useForm<EditContactField>({
    mode: 'onChange',
    defaultValues,
  })

  const { handleSubmit, formState, reset, watch } = methods

  const hasChanges = sanitizeName(watch('name') ?? '') !== entry.name

  const handleClose = () => {
    reset(defaultValues)
    setError('')
    onClose()
  }

  const onSubmit = handleSubmit(async (data) => {
    setError(undefined)

    const addressBookItem = {
      name: sanitizeName(data.name),
      address: entry.address,
      chainIds: configs.map((chain) => chain.chainId),
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
          message: getContactUpdatedMessage(workspaceAddressBookLabel),
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
                  <AddressInputReadOnly address={entry.address} />
                </div>

                {/* `hero` (66px) to match the AddressInputReadOnly above, whose wrapper is
                    min-height 66px — the default h-9 left the two fields visibly uneven. */}
                <NameInput
                  name="name"
                  label="Name"
                  required
                  validateCharset
                  minLength={NAME_MIN_LENGTH}
                  maxLength={ADDRESS_BOOK_NAME_MAX_LENGTH}
                  inputSize="hero"
                />
              </div>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertSeverityIcon variant="destructive" />
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
