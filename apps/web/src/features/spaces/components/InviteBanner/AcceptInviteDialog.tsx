import {
  type GetSpaceResponse,
  useMembersAcceptInviteV1Mutation,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useRouter } from 'next/router'
import { type ReactElement, useState } from 'react'
import { Alert, Box, Button, CircularProgress, DialogActions, DialogContent, Typography } from '@mui/material'
import { FormProvider, useForm } from 'react-hook-form'
import MUILink from '@mui/material/Link'
import Link from 'next/link'
import ModalDialog from '@/components/common/ModalDialog'
import NameInput from '@/components/common/NameInput'
import { AppRoutes } from '@/config/routes'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'

function AcceptInviteDialog({ space, onClose }: { space: GetSpaceResponse; onClose: () => void }): ReactElement {
  const [error, setError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { data: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const [acceptInvite] = useMembersAcceptInviteV1Mutation()
  const memberName = space.members.find((member) => member.user.id === currentUser?.id)?.name

  const methods = useForm<{ name: string }>({ mode: 'onChange', defaultValues: { name: memberName } })
  const { handleSubmit, formState } = methods

  const onSubmit = handleSubmit(async (data) => {
    setError(undefined)
    trackEvent({ ...SPACE_EVENTS.ACCEPT_INVITE_SUBMIT })

    try {
      setIsSubmitting(true)
      const response = await acceptInvite({ spaceId: space.id, acceptInviteDto: { name: data.name } })

      if (response.data) {
        router.push({ pathname: AppRoutes.spaces.index, query: { spaceId: space.id } })
        onClose()
      }

      if (response.error) {
        setError('Failed accepting the invite. Please try again.')
      }
    } catch (e) {
      // TODO: Handle this error case
      console.log(e)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <ModalDialog open onClose={onClose} dialogTitle="Accept invite" hideChainIndicator>
      <FormProvider {...methods}>
        <form onSubmit={onSubmit}>
          <DialogContent sx={{ py: 2 }}>
            <Box mb={2}>
              <NameInput data-testid="name-input" label="Name" autoFocus name="name" required />
            </Box>
            <Typography variant="body2" color="text.secondary">
              How is my data processed? Read our{' '}
              <Link href={AppRoutes.privacy} passHref legacyBehavior>
                <MUILink>privacy policy</MUILink>
              </Link>
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
            <Button type="submit" variant="contained" disabled={!formState.isValid} disableElevation>
              {isSubmitting ? <CircularProgress size={20} /> : 'Accept invite'}
            </Button>
          </DialogActions>
        </form>
      </FormProvider>
    </ModalDialog>
  )
}

export default AcceptInviteDialog
