import {
  type GetSpaceResponse,
  useMembersAcceptInviteV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useRouter } from 'next/router'
import { type ReactElement, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import ModalDialog from '@/components/common/ModalDialog'
import NameInput from '@/components/common/NameInput'
import DialogActions from '@/components/common/DialogActions'
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
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import { getRtkQueryErrorMessage } from '@/utils/rtkQuery'

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
        setError(getRtkQueryErrorMessage(response.error as FetchBaseQueryError | SerializedError))
        return
      }
    } catch (e) {
      setError(getRtkQueryErrorMessage(e as FetchBaseQueryError | SerializedError))
      return
    } finally {
      setIsSubmitting(false)
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

            <DialogActions
              className="px-6 pb-6"
              onCancel={onClose}
              cancelTestId="cancel-btn"
              confirmType="submit"
              confirmLabel="Accept invite"
              confirmTestId="confirm-accept-invite-button"
              confirmDisabled={!formState.isValid}
              confirmLoading={isSubmitting}
            />
          </form>
        </FormProvider>
      </div>
    </ModalDialog>
  )
}

export default AcceptInviteDialog
