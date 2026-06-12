import { useLoadFeature } from '@/features/__core__'
import { MyAccountsFeature } from '@/features/myAccounts'
import SpaceCard from 'src/features/spaces/components/SpaceCard'
import SignInOptions from '../SignInOptions'
import LocalSafesAlert from './LocalSafesAlert'
import { useIsRequireLoginEnabled } from '@/hooks/useIsRequireLoginEnabled'
import { useIsClassicViewFeatureEnabled } from '@/hooks/useClassicView'
import ClassicViewLink from '../ClassicViewLink'
import SpacesIcon from '@/public/images/spaces/spaces.svg'
import SafeMarkIcon from '@/public/images/logo-no-text.svg'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { Typography } from '@/components/ui/typography'
import { type GetSpaceResponse, useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import SpaceListInvite from '../InviteBanner'
import { useCallback, useState } from 'react'
import css from './styles.module.css'
import { useDarkMode } from '@/hooks/useDarkMode'
import { cn } from '@/utils/cn'
import { MemberStatus } from '@/features/spaces'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'
import { WorkspaceCreateEntryPoint } from '@/services/analytics/mixpanel-events'
import SpaceInfoModal from '../SpaceInfoModal'
import { filterSpacesByStatus, getInvitedByName } from '@/features/spaces/utils'
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
  const isDarkMode = useDarkMode()

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      <div className={cn('relative flex min-h-screen items-center justify-center bg-background p-6', css.authShell)}>
        <div className="relative w-full max-w-[440px] rounded-lg bg-card p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]">
          <div className="mb-6 flex size-10 items-center justify-center text-foreground">
            <SafeMarkIcon className="size-10" />
          </div>

          <Typography variant="h3" className="mb-6">
            Sign in to your workspace
          </Typography>

          <LocalSafesAlert />

          <SignInOptions afterSignIn={afterSignIn} redirectLoading={redirectLoading} />

          {isClassicViewFeatureEnabled && <ClassicViewLink />}

          <p className="mt-4 text-center text-xs leading-[18px] text-muted-foreground">
            By continuing, you agree to the{' '}
            <NextLink
              href={AppRoutes.terms}
              className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Terms
            </NextLink>{' '}
            and{' '}
            <NextLink
              href={AppRoutes.privacy}
              className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Privacy Policy
            </NextLink>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

const NoSpacesState = ({ isAtLimit }: { isAtLimit: boolean }) => {
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false)

  return (
    <>
      <Card className="w-full p-10 text-center">
        <div className="flex justify-center">
          <SpacesIcon />
        </div>

        <div className="mb-6">
          <Typography color="muted" className="mb-2">
            No workspaces found.
            <br />
          </Typography>
          <Link onClick={() => setIsInfoOpen(true)} href="#">
            What are workspaces?
          </Link>
        </div>
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

  const singleSpaceId = activeSpaces.length === 1 ? String(activeSpaces[0].id) : null

  const { setHasSignedIn, redirectLoading } = useSignInRedirect({
    spacesAmount: spaces?.length || 0,
    inviteAmount: inviteAmount || 0,
    // Treat any state without a definitive answer as still loading. The
    // skip→unskip transition (re-login after logout) returns isFetching=false
    // and isUninitialized=false on the render where skip flips — RTK Query
    // dispatches the refetch in a useEffect, so the loading flags lag one
    // render behind. Without the `spaces === undefined && !error` clause an
    // existing user gets bounced into /welcome/create-space because the hook
    // reads spacesAmount=0 with isSpacesLoading=false. Once spaces or error
    // resolves, this clause becomes false and the normal redirect logic runs.
    isSpacesLoading: isFetching || isUninitialized || (spaces === undefined && !error),
    error: error || undefined,
    singleSpaceId,
  })

  const afterSignIn = useCallback(() => {
    setHasSignedIn(true)
  }, [setHasSignedIn])

  // The spaces query is skipped while signed out, so pendingInvites is always
  // [] — no need to gate the early return on it.
  if (!isUserSignedIn) {
    return <SignedOutState afterSignIn={afterSignIn} redirectLoading={redirectLoading} />
  }

  return (
    <div className={css.container}>
      <div className={css.mySpaces}>
        <div className={css.spacesHeader}>
          {!isRequireLoginEnabled && <AccountsNavigation />}

          {isUserSignedIn && activeSpaces.length > 0 && (
            <AddSpaceButton
              disabled={isAtSpacesLimit}
              onClick={() =>
                trackEvent(SPACE_EVENTS.WORKSPACE_CREATE_STARTED, { entry_point: WorkspaceCreateEntryPoint.WELCOME })
              }
            />
          )}
        </div>

        {isUserSignedIn &&
          pendingInvites.length > 0 &&
          pendingInvites.map((invitingSpace: GetSpaceResponse) => (
            <SpaceListInvite
              key={invitingSpace.id}
              space={invitingSpace}
              invitedByName={getInvitedByName(invitingSpace, currentUser?.id)}
            />
          ))}

        {activeSpaces.length > 0 ? (
          <div className="grid grid-cols-1 flex-wrap gap-4 md:grid-cols-2" data-testid="org-list">
            {activeSpaces.map((space) => (
              <div key={space.name}>
                <SpaceCard space={space} currentUserId={currentUser?.id} />
              </div>
            ))}
          </div>
        ) : (
          isUserSignedIn && <NoSpacesState isAtLimit={isAtSpacesLimit} />
        )}
      </div>
    </div>
  )
}

export default SpacesList
