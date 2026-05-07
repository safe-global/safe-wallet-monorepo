import { useLoadFeature } from '@/features/__core__'
import { MyAccountsFeature } from '@/features/myAccounts'
import SpaceCard from 'src/features/spaces/components/SpaceCard'
import SignInOptions from '../SignInOptions'
import SpacesIcon from '@/public/images/spaces/spaces.svg'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { Box, Card, Grid2, Link, Typography } from '@mui/material'
import { Button } from '@/components/ui/button'
import { type GetSpaceResponse, useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import SpaceListInvite from '../InviteBanner'
import { useCallback, useState } from 'react'
import css from './styles.module.css'
import { MemberStatus } from '@/features/spaces'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'
import { WorkspaceCreateEntryPoint } from '@/services/analytics/mixpanel-events'
import SpaceInfoModal from '../SpaceInfoModal'
import { filterSpacesByStatus } from '@/features/spaces/utils'
import { AppRoutes } from '@/config/routes'
import NextLink from 'next/link'
import { useSignInRedirect } from '@/components/welcome/WelcomeLogin/hooks/useSignInRedirect'
import AddIcon from '@/public/images/common/add.svg'

const PendingInvitations = ({ pendingInvites }: { pendingInvites: GetSpaceResponse[] }) => {
  if (pendingInvites.length === 0) return null

  if (pendingInvites.length === 1) {
    return <SpaceListInvite space={pendingInvites[0]} isProminent />
  }

  return (
    <Box mb={3}>
      <Typography variant="h4" fontWeight={700} mb={2}>
        Pending invitations ({pendingInvites.length})
      </Typography>

      {pendingInvites.map((invitingSpace) => (
        <SpaceListInvite key={invitingSpace.id} space={invitingSpace} />
      ))}
    </Box>
  )
}

const AddSpaceButton = ({ onClick }: { onClick?: () => void }) => {
  return (
    <Button
      data-testid="create-space-button"
      variant="default"
      size="lg"
      className="h-full rounded-lg px-6 py-3 text-base"
      render={<NextLink href={AppRoutes.welcome.createSpace} />}
      onClick={onClick}
    >
      <AddIcon className="size-5 fill-primary-foreground" />
      Create space
    </Button>
  )
}

const SignedOutState = ({ afterSignIn, redirectLoading }: { afterSignIn: () => void; redirectLoading: boolean }) => {
  return (
    <Card sx={{ p: 5, textAlign: 'center' }}>
      <Typography variant="h3" fontWeight={600} mb={3}>
        Sign in
      </Typography>

      <Typography color="text.secondary" mb={3}>
        Sign in to view or create a Space.
      </Typography>

      <SignInOptions afterSignIn={afterSignIn} redirectLoading={redirectLoading} />
    </Card>
  )
}

const NoSpacesState = () => {
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false)

  return (
    <>
      <Card sx={{ p: 5, textAlign: 'center', width: 1 }}>
        <Box display="flex" justifyContent="center">
          <SpacesIcon />
        </Box>

        <Box mb={3}>
          <Typography color="text.secondary" mb={1}>
            No spaces found.
            <br />
          </Typography>
          <Link onClick={() => setIsInfoOpen(true)} href="#">
            What are spaces?
          </Link>
        </Box>
        <div className="h-12">
          <AddSpaceButton
            onClick={() =>
              trackEvent(SPACE_EVENTS.WORKSPACE_CREATE_STARTED, { entry_point: WorkspaceCreateEntryPoint.WELCOME })
            }
          />
        </div>
      </Card>
      {isInfoOpen && <SpaceInfoModal onClose={() => setIsInfoOpen(false)} />}
    </>
  )
}

const SpacesList = () => {
  const { AccountsNavigation } = useLoadFeature(MyAccountsFeature)
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const {
    currentData: spaces,
    isFetching: isSpacesLoading,
    error,
  } = useSpacesGetV1Query(undefined, { skip: !isUserSignedIn })
  const pendingInvites = filterSpacesByStatus(currentUser, spaces || [], MemberStatus.INVITED)
  const activeSpaces = filterSpacesByStatus(currentUser, spaces || [], MemberStatus.ACTIVE)
  const inviteAmount = pendingInvites?.length

  const { setHasSignedIn, redirectLoading } = useSignInRedirect({
    spacesAmount: spaces?.length || 0,
    inviteAmount: inviteAmount || 0,
    isSpacesLoading: isSpacesLoading || false,
    error: error || undefined,
  })

  const afterSignIn = useCallback(() => {
    setHasSignedIn(true)
  }, [setHasSignedIn])

  return (
    <Box className={css.container}>
      <Box className={css.mySpaces}>
        <Box className={css.spacesHeader}>
          <AccountsNavigation />

          {isUserSignedIn && activeSpaces.length > 0 && (
            <AddSpaceButton
              onClick={() =>
                trackEvent(SPACE_EVENTS.WORKSPACE_CREATE_STARTED, { entry_point: WorkspaceCreateEntryPoint.WELCOME })
              }
            />
          )}
        </Box>

        {isUserSignedIn && <PendingInvitations pendingInvites={pendingInvites} />}

        {isUserSignedIn || (!redirectLoading && pendingInvites.length) ? (
          <>
            {activeSpaces.length > 0 ? (
              <Grid2 container spacing={2} flexWrap="wrap" data-testid="org-list">
                {activeSpaces.map((space) => (
                  <Grid2 size={{ xs: 12, md: 6 }} key={space.name}>
                    <SpaceCard space={space} currentUserId={currentUser?.id} />
                  </Grid2>
                ))}
              </Grid2>
            ) : pendingInvites.length === 0 ? (
              <NoSpacesState />
            ) : null}
          </>
        ) : (
          <SignedOutState afterSignIn={afterSignIn} redirectLoading={redirectLoading} />
        )}
      </Box>
    </Box>
  )
}

export default SpacesList
