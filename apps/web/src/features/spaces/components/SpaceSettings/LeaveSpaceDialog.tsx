import { useState } from 'react'
import { useRouter } from 'next/router'
import { type GetSpaceResponse, useMembersSelfRemoveV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { AppRoutes } from '@/config/routes'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'
import { LeaveSpaceDialogView } from '@views/features/spaces/components/SpaceSettings/LeaveSpaceDialogView'

const LeaveSpaceDialog = ({ space, onClose }: { space: GetSpaceResponse | undefined; onClose: () => void }) => {
  const [error, setError] = useState<string>()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [leaveSpace, { isLoading }] = useMembersSelfRemoveV1Mutation()

  const onLeave = async () => {
    if (!space) return

    setError(undefined)

    try {
      await leaveSpace({ spaceId: space.uuid }).unwrap()
      onClose()

      trackEvent({ ...SPACE_EVENTS.LEAVE_SPACE })
      dispatch(
        showNotification({
          message: `Left Workspace ${space.name}.`,
          variant: 'success',
          groupKey: 'leave-space-success',
        }),
      )

      router.push({ pathname: AppRoutes.welcome.spaces })
    } catch (e) {
      console.error(e)
      setError('Error leaving the Workspace. Please try again.')
    }
  }

  return (
    <LeaveSpaceDialogView
      spaceName={space?.name}
      hasSpace={!!space}
      error={error}
      isLoading={isLoading}
      onClose={onClose}
      onLeave={onLeave}
    />
  )
}

export default LeaveSpaceDialog
