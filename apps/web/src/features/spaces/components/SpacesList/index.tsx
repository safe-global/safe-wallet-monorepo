import { useLoadFeature } from '@/features/__core__'
import { MyAccountsFeature } from '@/features/myAccounts'
import SpaceCard from 'src/features/spaces/components/SpaceCard'
import SignInOptions from '../SignInOptions'
import OnboardingIllustration from '../OnboardingLayout/Illustration'
import { useIsRequireLoginEnabled } from '@/hooks/useIsRequireLoginEnabled'
import { useIsClassicViewFeatureEnabled } from '@/hooks/useClassicView'
import { useDarkMode } from '@/hooks/useDarkMode'
import ClassicViewLink from '../ClassicViewLink'
import SafeLogo from '@/public/images/logo-no-text.svg'
import SpacesIcon from '@/public/images/spaces/spaces.svg'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { Box, Card, Grid2, Link, Typography } from '@mui/material'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'
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
      Create space
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
  const isDarkMode = useDarkMode()

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className="flex w-full items-stretch overflow-hidden rounded-3xl bg-card shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <section className="flex w-full flex-col gap-6 px-8 py-10 sm:px-12 sm:py-14 lg:w-1/2">
          <SafeLogo alt="Safe logo" width={32} height={32} />

          <div className="flex flex-1 flex-col justify-center gap-6">
            <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-foreground">Sign in</h1>

            <p className="max-w-[380px] text-sm leading-5 text-muted-foreground">Sign in to view or create a Space.</p>

            <div className="max-w-[380px]">
              <SignInOptions afterSignIn={afterSignIn} redirectLoading={redirectLoading} />
            </div>
          </div>
        </section>

        <aside className="relative hidden items-center justify-center overflow-hidden bg-[var(--onboarding-illustration-bg,_#f4f4f4)] lg:flex lg:w-1/2">
          <OnboardingIllustration />
        </aside>
      </div>

      {isClassicViewFeatureEnabled && <ClassicViewLink />}
    </div>
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
            No spaces found.
            <br />
          </Typography>
          <Link onClick={() => setIsInfoOpen(true)} href="#">
            What are spaces?
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
    isFetching: isSpacesLoading,
    error,
  } = useSpacesGetV1Query(undefined, { skip: !isUserSignedIn })
  const pendingInvites = filterSpacesByStatus(currentUser, spaces || [], MemberStatus.INVITED)
  const activeSpaces = filterSpacesByStatus(currentUser, spaces || [], MemberStatus.ACTIVE)
  const inviteAmount = pendingInvites?.length
  const isAtSpacesLimit = activeSpaces.length >= SPACES_LIMIT

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
