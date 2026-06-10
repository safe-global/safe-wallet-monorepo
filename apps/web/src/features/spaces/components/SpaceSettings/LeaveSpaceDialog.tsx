import { useState } from 'react'
import { useRouter } from 'next/router'
import { LogOut } from 'lucide-react'
import { type GetSpaceResponse, useMembersSelfRemoveV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AppRoutes } from '@/config/routes'
import { useAppDispatch } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'

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
          message: `Left workspace ${space.name}.`,
          variant: 'success',
          groupKey: 'leave-space-success',
        }),
      )

      router.push({ pathname: AppRoutes.welcome.spaces })
    } catch (e) {
      console.error(e)
      setError('Error leaving the workspace. Please try again.')
    }
  }

  return (
    <AlertDialog open onOpenChange={(open) => !open && !isLoading && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center justify-center size-10 rounded-full bg-destructive/10 text-destructive shrink-0">
            <LogOut className="size-5" />
          </div>
          <AlertDialogTitle>Leave workspace</AlertDialogTitle>
          <AlertDialogDescription>
            You&apos;ll lose access to <span className="font-semibold text-foreground">{space?.name}</span> immediately.
            An admin can re-invite you later.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Typography variant="paragraph-small" color="muted">
          Your wallet and any linked Safe Accounts are not affected.
        </Typography>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onLeave}
            disabled={isLoading || !space}
            data-testid="space-confirm-leave-button"
          >
            {isLoading ? 'Leaving…' : 'Leave workspace'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default LeaveSpaceDialog
