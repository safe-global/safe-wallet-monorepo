import { useLoadFeature } from '@/features/__core__'
import { MyAccountsFeature } from '@/features/myAccounts'
import SpaceCard from 'src/features/spaces/components/SpaceCard'
import SignInOptions from '../SignInOptions'
import LocalSafesAlert from './LocalSafesAlert'
import { useIsRequireLoginEnabled } from '@/hooks/useIsRequireLoginEnabled'
import { useIsClassicViewFeatureEnabled } from '@/hooks/useClassicView'
import ClassicViewLink from '../ClassicViewLink'
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
import { SPACES_LIMIT } from '../Sidebar/constants'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const AddSpaceButton = ({ onClick, disabled }: { onClick?: () => void; disabled?: boolean }) => {
  const button = (
    <Button
      data-testid="create-space-button"
      variant="default"
      size="lg"
      className={`h-full rounded-lg px-6 py-3 text-base${disabled ? ' cursor-not-allowed opacity-50 grayscale' : ''}`}
      render={disabled ? <span /> : <NextLink href={AppRoutes.welcome.createSpace} />}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
    >
      <AddIcon className="size-5 fill-primary-foreground" />
      Create workspace
    </Button>
  )

  if (!disabled) return button

  return (
    <Tooltip>
      <TooltipTrigger render={<div className="inline-flex" />}>{button}</TooltipTrigger>
      <TooltipContent>Limit of {SPACES_LIMIT} workspaces reached</TooltipContent>
    </Tooltip>
  )
}

const SignedOutState = ({ afterSignIn, redirectLoading }: { afterSignIn: () => void; redirectLoading: boolean }) => {
  const isClassicViewFeatureEnabled = useIsClassicViewFeatureEnabled() === true

  return (
    <>
      <Card sx={{ p: 5, textAlign: 'center' }}>
        <Typography variant="h3" fontWeight={600} mb={3}>
          Sign in
        </Typography>

        <Typography color="text.secondary" mb={3}>
          Sign in to view or create a workspace.
        </Typography>

        <LocalSafesAlert />

        <SignInOptions afterSignIn={afterSignIn} redirectLoading={redirectLoading} />
      </Card>

      {isClassicViewFeatureEnabled && <ClassicViewLink />}
    </>
  )
}

const NoSpacesState = ({ isAtLimit }: { isAtLimit: boolean }) => {
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false)

  return (
    <>
      <Card sx={{ p: 5, textAlign: 'center', width: 1 }}>
        <Box display="flex" justifyContent="center">
          <SpacesIcon />
        </Box>

        <Box mb={3}>
          <Typography color="text.secondary" mb={1}>
            No workspaces found.
            <br />
          </Typography>
          <Link onClick={() => setIsInfoOpen(true)} href="#">
            What are workspaces?
          </Link>
        </Box>
        <div className="h-12">
          <AddSpaceButton
            disabled={isAtLimit}
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
  const isRequireLoginEnabled = useIsRequireLoginEnabled() ?? false
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const {
    currentData: spaces,
    isFetching,
    isUninitialized,
    error,
  } = useSpacesGetV1Query(undefined, { skip: !isUserSignedIn })
  const pendingInvites = filterSpacesByStatus(currentUser, spaces || [], MemberStatus.INVITED)
  const activeSpaces = filterSpacesByStatus(currentUser, spaces || [], MemberStatus.ACTIVE)
  const inviteAmount = pendingInvites?.length
  const isAtSpacesLimit = activeSpaces.length >= SPACES_LIMIT

  const { setHasSignedIn, redirectLoading } = useSignInRedirect({
    spacesAmount: spaces?.length || 0,
    inviteAmount: inviteAmount || 0,
    // Treat the "skip→unskip" transition as still loading. On the render where
    // skip flips to false RTK Query returns isFetching=false but hasn't yet
    // dispatched the fetch (that happens in a useEffect), so isFetching alone
    // would lead useSignInRedirect to read spacesAmount=0 and bounce existing
    // users into the create-space flow on re-login.
    isSpacesLoading: isFetching || isUninitialized,
    error: error || undefined,
  })

  const afterSignIn = useCallback(() => {
    setHasSignedIn(true)
  }, [setHasSignedIn])

  return (
    <Box className={css.container}>
      <Box className={css.mySpaces}>
        <Box className={css.spacesHeader}>
          {!isRequireLoginEnabled && <AccountsNavigation />}

          {isUserSignedIn && activeSpaces.length > 0 && (
            <AddSpaceButton
              disabled={isAtSpacesLimit}
              onClick={() =>
                trackEvent(SPACE_EVENTS.WORKSPACE_CREATE_STARTED, { entry_point: WorkspaceCreateEntryPoint.WELCOME })
              }
            />
          )}
        </Box>

        {isUserSignedIn &&
          pendingInvites.length > 0 &&
          pendingInvites.map((invitingSpace: GetSpaceResponse) => (
            <SpaceListInvite key={invitingSpace.id} space={invitingSpace} />
          ))}

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
            ) : (
              <NoSpacesState isAtLimit={isAtSpacesLimit} />
            )}
          </>
        ) : (
          <SignedOutState afterSignIn={afterSignIn} redirectLoading={redirectLoading} />
        )}
      </Box>
    </Box>
  )
}

export default SpacesList
