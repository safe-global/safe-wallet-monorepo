import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { ChainIndicatorList } from '@/features/multichain'
import { useAddressBooksDeleteByAddressV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useCurrentSpaceId, useWorkspaceAddressBookLabel } from '@/features/spaces'
import { useState } from 'react'
import { useDarkMode } from '@/hooks/useDarkMode'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { getContactRemovedMessage } from '@/utils/addressBookNotifications'
import { isElevationRequiredError } from '@/features/oidc-auth/utils/elevation'
import { DeleteContactDialogView } from '@views/features/spaces/components/SpaceAddressBook/DeleteContactDialogView'

type DeleteContactDialogProps = {
  name: string
  address: string
  networks: string[]
  onClose: () => void
}

const DeleteContactDialog = ({ name, address, networks, onClose }: DeleteContactDialogProps) => {
  const [hasError, setHasError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dispatch = useAppDispatch()
  const spaceId = useCurrentSpaceId()
  const isDarkMode = useDarkMode()
  const workspaceAddressBookLabel = useWorkspaceAddressBookLabel()
  const [deleteEntry] = useAddressBooksDeleteByAddressV1Mutation()

  const handleConfirm = async () => {
    setHasError(false)

    try {
      setIsSubmitting(true)
      trackEvent({ ...SPACE_EVENTS.REMOVE_ADDRESS_SUBMIT })
      const response = await deleteEntry({ spaceId: spaceId ?? '', address })

      if (isElevationRequiredError(response.error)) return
      if (response.error) {
        setHasError(true)
        return
      }

      dispatch(
        showNotification({
          message: getContactRemovedMessage(workspaceAddressBookLabel),
          variant: 'success',
          groupKey: 'delete-contact-success',
        }),
      )

      onClose()
    } catch (error) {
      setHasError(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DeleteContactDialogView
      name={name}
      onClose={onClose}
      onConfirm={handleConfirm}
      isDarkMode={isDarkMode}
      hasError={hasError}
      isSubmitting={isSubmitting}
      chainList={<ChainIndicatorList chainIds={networks} />}
    />
  )
}

export default DeleteContactDialog
