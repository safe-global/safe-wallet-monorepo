import { useState } from 'react'
import { useRouter } from 'next/router'
import { type GetSpaceResponse, useSpacesDeleteV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { AppRoutes } from '@/config/routes'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'
import { isElevationRequiredError } from '@/features/oidc-auth/utils/elevation'
import { DeleteSpaceDialogView } from '@views/features/spaces/components/SpaceSettings/DeleteSpaceDialogView'

const DeleteSpaceDialog = ({ space, onClose }: { space: GetSpaceResponse | undefined; onClose: () => void }) => {
  const [error, setError] = useState<string>()
  const [confirmName, setConfirmName] = useState('')
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [deleteSpace, { isLoading }] = useSpacesDeleteV1Mutation()

  const canConfirm = !!space && confirmName.trim() === space.name.trim() && !isLoading

  const onDelete = async () => {
    if (!space || !canConfirm) return

    setError(undefined)

    try {
      await deleteSpace({ id: space.uuid }).unwrap()
      onClose()

      trackEvent({ ...SPACE_EVENTS.DELETE_SPACE })
      dispatch(
        showNotification({
          message: `Deleted Workspace ${space.name}.`,
          variant: 'success',
          groupKey: 'delete-space-success',
        }),
      )

      router.push({ pathname: AppRoutes.welcome.spaces })
    } catch (e) {
      if (isElevationRequiredError(e)) return
      console.error(e)
      setError('Error deleting the Workspace. Please try again.')
    }
  }

  return (
    <DeleteSpaceDialogView
      spaceName={space?.name}
      confirmName={confirmName}
      onConfirmNameChange={setConfirmName}
      error={error}
      canConfirm={canConfirm}
      isLoading={isLoading}
      onClose={onClose}
      onDelete={onDelete}
    />
  )
}

export default DeleteSpaceDialog
