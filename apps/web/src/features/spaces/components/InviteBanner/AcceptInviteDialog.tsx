import {
  type GetSpaceResponse,
  useMembersAcceptInviteV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useRouter } from 'next/router'
import { type ReactElement, useState } from 'react'
import { Alert, Box, Button, CircularProgress, DialogActions, DialogContent, Typography } from '@mui/material'
import { FormProvider, useForm } from 'react-hook-form'
import ModalDialog from '@/components/common/ModalDialog'
import NameInput from '@/components/common/NameInput'
import { MEMBER_NAME_MAX_LENGTH, NAME_MIN_LENGTH, sanitizeName } from '@safe-global/utils/validation/names'
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
      const response = await acceptInvite({ spaceId: space.uuid, acceptInviteDto: { name: sanitizeName(data.name) } })

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
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <DialogContent sx={{ py: 2 }}>
            <Box mb={2}>
              <NameInput
                data-testid="invite-name-input"
                label="Name"
                autoFocus
                name="name"
                required
                validateCharset
                minLength={NAME_MIN_LENGTH}
                maxLength={MEMBER_NAME_MAX_LENGTH}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              How is my data processed? Read our <ExternalLink href={AppRoutes.privacy}>privacy policy</ExternalLink>
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </DialogContent>

          <DialogActions>
            <Button data-testid="cancel-btn" onClick={onClose}>
              Cancel
            </Button>
            <Button
              data-testid="confirm-accept-invite-button"
              type="submit"
              variant="contained"
              disabled={!formState.isValid}
              disableElevation
            >
              {isSubmitting ? <CircularProgress size={20} /> : 'Accept invite'}
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </ModalDialog>
  )
}

export default AcceptInviteDialog
