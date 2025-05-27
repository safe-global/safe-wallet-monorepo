import { Alert, Button, DialogActions, DialogContent, Typography } from '@mui/material'
import ModalDialog from '@/components/common/ModalDialog'
import { type GetSpaceResponse, useMembersSelfRemoveV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { AppRoutes } from '@/config/routes'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { showNotification } from '@/store/notificationsSlice'
import { useAppDispatch } from '@/store'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'

const LeaveSpaceDialog = ({ space, onClose }: { space: GetSpaceResponse | undefined; onClose: () => void }) => {
  const [error, setError] = useState<string>()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [leaveSpace] = useMembersSelfRemoveV1Mutation()

  const onLeave = async () => {
    if (!space) return

    setError(undefined)

    try {
      const res = await leaveSpace({ spaceId: space.id })

      if (res.error) {
        throw new Error(JSON.stringify(res.error))
      }

      onClose()

      trackEvent({ ...SPACE_EVENTS.LEAVE_SPACE })
      dispatch(
        showNotification({
          message: `Left space ${space.name}.`,
          variant: 'success',
          groupKey: 'leave-space-success',
        }),
      )

      router.push({ pathname: AppRoutes.welcome.spaces })
    } catch (e) {
      console.error(e)
      setError('Error leaving the space. Please try again.')
    }
  }

  return (
    <ModalDialog dialogTitle="Leave space" hideChainIndicator open onClose={onClose}>
      <DialogContent sx={{ mt: 2 }}>
        <Typography mb={2}>
          Are you sure you want to leave this space? You won’t be able to access its data anymore.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button data-testid="space-confirm-leave-button" variant="danger" onClick={onLeave}>
          Leave space
        </Button>
      </DialogActions>
    </ModalDialog>
  )
}

export default LeaveSpaceDialog
