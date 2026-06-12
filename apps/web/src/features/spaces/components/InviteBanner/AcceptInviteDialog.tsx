import {
  type GetSpaceResponse,
  useMembersAcceptInviteV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useRouter } from 'next/router'
import { type ReactElement, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import ModalDialog from '@/components/common/ModalDialog'
import NameInput from '@/components/common/NameInput'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/utils/cn'
import { useDarkMode } from '@/hooks/useDarkMode'
import { AppRoutes } from '@/config/routes'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'
import { showNotification } from '@/store/notificationsSlice'
import ExternalLink from '@/components/common/ExternalLink'

function AcceptInviteDialog({ space, onClose }: { space: GetSpaceResponse; onClose: () => void }): ReactElement {
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isDarkMode = useDarkMode()

  const dispatch = useAppDispatch()
  const router = useRouter()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { data: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const [acceptInvite] = useMembersAcceptInviteV1Mutation()
  const memberName = space.members.find((member) => member.user.id === currentUser?.id)?.name

  const methods = useForm<{ name: string }>({ mode: 'onChange', defaultValues: { name: memberName } })
  const { handleSubmit, formState } = methods

  const onSubmit = handleSubmit(async (data) => {
    setError(undefined)

    try {
      setIsSubmitting(true)
      const response = await acceptInvite({ spaceId: space.uuid, acceptInviteDto: { name: data.name } })

      if (response.error) {
        throw response.error
      }

      trackEvent(
        { ...SPACE_EVENTS.WORKSPACE_MEMBER_INVITE_ACCEPTED, label: space.uuid },
        { workspace_id: space.uuid, user_id: currentUser?.id },
      )

      if (router.pathname === AppRoutes.welcome.spaces) {
        router.push({ pathname: AppRoutes.spaces.index, query: { spaceId: space.uuid } })
      }

      onClose()

      dispatch(
        showNotification({
          message: `Accepted invite to ${space.name}`,
          variant: 'success',
          groupKey: 'accept-invite-success',
        }),
      )
    } catch (e) {
      setError('Failed accepting the invite. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <ModalDialog open onClose={onClose} dialogTitle="Accept invite" hideChainIndicator>
      <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
        <FormProvider {...methods}>
          <form onSubmit={onSubmit}>
            <div className="px-6 py-4">
              <div className="mb-4">
                <NameInput data-testid="invite-name-input" label="Name" autoFocus name="name" required />
              </div>
              <Typography variant="paragraph-small" color="muted">
                How is my data processed? Read our <ExternalLink href={AppRoutes.privacy}>privacy policy</ExternalLink>
              </Typography>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex justify-end gap-2 px-6 pb-6">
              <Button variant="ghost" data-testid="cancel-btn" onClick={onClose}>
                Cancel
              </Button>
              <Button data-testid="confirm-accept-invite-button" type="submit" disabled={!formState.isValid}>
                {isSubmitting ? <Spinner className="size-5" /> : 'Accept invite'}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </ModalDialog>
  )
}

export default AcceptInviteDialog
