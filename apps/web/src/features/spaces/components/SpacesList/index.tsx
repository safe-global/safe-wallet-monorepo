import { useLoadFeature } from '@/features/__core__'
import { MyAccountsFeature } from '@/features/myAccounts'
import { SafeProFeature, useIsSafeProEnabled, useSafeProTrialPrompt } from '@/features/safe-pro-announcement'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { ShadcnProvider } from '@/components/ui/ShadcnProvider'
import TrialFlow from '../Plans/TrialFlow'
import SpaceRow from './SpaceRow'
import SignInOptions from '../SignInOptions'
import WorkspaceBanner from '../WorkspaceBanner'
import SpacesIcon from '@/public/images/spaces/spaces.svg'
import SafeMarkIcon from '@/public/images/logo-no-text.svg'
import SafeProLockup from '@/public/images/safe-pro/safe-pro-lockup.svg'
import SafeProLockupDark from '@/public/images/safe-pro/safe-pro-lockup-dark.svg'
import { useAppSelector } from '@/store'
import { isAuthenticated, selectIsStoreHydrated } from '@/store/authSlice'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
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
import { SPACES_LIMIT } from '@/features/spaces/constants'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import WelcomeContentCard from '@/components/common/WelcomeContentCard'

const AddSpaceButton = ({
  onClick,
  disabled,
  size = 'lg',
  variant = 'default',
  label = 'Create Workspace',
  icon = 'add',
}: {
  onClick?: () => void
  disabled?: boolean
  size?: 'lg' | 'default'
  variant?: 'default' | 'outline'
  label?: string
  icon?: 'add' | 'arrow'
}) => {
  const iconSize = size === 'lg' ? 'size-5' : 'size-4'

  const button = (
    <Button
      data-testid="create-space-button"
      variant={variant}
      size={size}
      className={cn(
        // eslint-disable-next-line no-restricted-syntax -- bespoke full-height create-workspace CTA sizing from dev's #8271 redesign
        size === 'lg' && 'h-full rounded-lg px-6 py-3 text-base',
        variant === 'outline' && 'hover:bg-muted',
        disabled && 'cursor-not-allowed opacity-50 grayscale',
      )}
      render={disabled ? <span /> : <NextLink href={AppRoutes.welcome.createSpace} />}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
    >
      {icon === 'add' && (
        <AddIcon className={cn(variant === 'default' ? 'fill-primary-foreground' : 'fill-foreground', iconSize)} />
      )}
      {label}
      {icon === 'arrow' && <ArrowRight className={iconSize} />}
    </Button>
  )

  if (!disabled) return button

  return (
    <Tooltip>
      <TooltipTrigger render={<div className="inline-flex" />}>{button}</TooltipTrigger>
      <TooltipContent>Limit of {SPACES_LIMIT} Workspaces reached</TooltipContent>
    </Tooltip>
  )
}

const SignedOutState = ({ afterSignIn, redirectLoading }: { afterSignIn: () => void; redirectLoading: boolean }) => {
  const isDarkMode = useDarkMode()
  const isSafeProEnabled = useIsSafeProEnabled()
  const { SafeProBanner } = useLoadFeature(SafeProFeature)

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      {/* The page keeps its Topbar + Accounts/Workspaces tabs, so the sign-in
          card renders inline rather than as a full-screen takeover. */}
      <div className={cn('relative flex items-center justify-center p-6 pb-10', isSafeProEnabled ? 'pt-0' : 'pt-10')}>
        <div className="flex w-full max-w-[440px] flex-col items-center">
          {isSafeProEnabled ? <SafeProBanner className="mb-4" /> : <WorkspaceBanner className="mb-3" />}

          <div className="relative w-full">
            <div className="relative w-full rounded-lg bg-card p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]">
              <div className="mx-auto mb-6 flex h-10 items-center justify-center text-foreground">
                {isSafeProEnabled ? (
                  isDarkMode ? (
                    <SafeProLockupDark className="h-10 w-auto" />
                  ) : (
                    <SafeProLockup className="h-10 w-auto" />
                  )
                ) : (
                  <SafeMarkIcon className="size-10" />
                )}
              </div>

              <Typography variant="h3" className="mb-6 text-center">
                Sign in to your Workspace
              </Typography>

              <SignInOptions afterSignIn={afterSignIn} redirectLoading={redirectLoading} />
            </div>
          </div>

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

export const WORKSPACE_BENEFITS = [
  'Organize multiple Safe accounts in one place',
  'Invite members and manage their roles',
  'Share an address book across your team',
]

const NoSpacesState = ({ isAtLimit }: { isAtLimit: boolean }) => {
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false)

  return (
    <>
      <Card size="none" className="w-full">
        <div className="flex flex-col p-10 text-center">
          <div className="mb-4 flex justify-center">
            <SpacesIcon />
          </div>

          <Typography variant="h4" className="mb-2 font-bold">
            Create your first workspace
          </Typography>
          <Typography color="muted" className="mb-3">
            Collaborate on your Safe accounts with your team.
          </Typography>

          <div className="mx-auto mt-2 mb-6 flex max-w-[360px] flex-col gap-3 text-left">
            {WORKSPACE_BENEFITS.map((benefit) => (
              <div key={benefit} className="flex flex-row items-center gap-1.5">
                <Check className="size-4 shrink-0 text-primary" />
                <Typography variant="paragraph-small">{benefit}</Typography>
              </div>
            ))}
          </div>

          <div className="h-12">
            <AddSpaceButton
              disabled={isAtLimit}
              onClick={() =>
                trackEvent(SPACE_EVENTS.WORKSPACE_CREATE_STARTED, { entry_point: WorkspaceCreateEntryPoint.WELCOME })
              }
            />
          </div>

          <div className="mt-2">
            <Link onClick={() => setIsInfoOpen(true)} href="#">
              What are workspaces?
            </Link>
          </div>
        </div>
      </Card>
      {isInfoOpen && <SpaceInfoModal onClose={() => setIsInfoOpen(false)} />}
    </>
  )
}

const SpacesList = () => {
  const { AccountsNavigation } = useLoadFeature(MyAccountsFeature)
  const { SafeProWorkspacesBanner } = useLoadFeature(SafeProFeature)
  const isSafeProEnabled = useIsSafeProEnabled()
  const isSafePro = useHasFeature(FEATURES.SAFE_PRO) === true
  const isDarkMode = useDarkMode()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const isStoreHydrated = useAppSelector(selectIsStoreHydrated)
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const {
    currentData: spaces,
    isFetching,
    isUninitialized,
    error,
    refetch,
  } = useSpacesGetV1Query(undefined, { skip: !isUserSignedIn })
  const pendingInvites = filterSpacesByStatus(currentUser, spaces || [], MemberStatus.INVITED)
  const activeSpaces = filterSpacesByStatus(currentUser, spaces || [], MemberStatus.ACTIVE)
  const isAtSpacesLimit = activeSpaces.length >= SPACES_LIMIT

  const singleSpaceId = activeSpaces.length === 1 ? activeSpaces[0].uuid : null

  // Treat any indefinite state as loading. On the skip→unskip flip (re-login
  // after logout) RTK Query lags one render — isFetching/isUninitialized are
  // both false while spaces is still undefined. The `spaces === undefined &&
  // !error` clause covers that gap so an existing user isn't bounced into
  // /welcome/create-space on a stale spacesAmount=0.
  const isSpacesLoading = isFetching || isUninitialized || (spaces === undefined && !error)

  const { setHasSignedIn, redirectLoading } = useSignInRedirect({
    spacesAmount: spaces?.length || 0,
    inviteAmount: pendingInvites.length,
    isSpacesLoading,
    error: error || undefined,
    singleSpaceId,
  })

  const hasNoSpaces = isUserSignedIn && !isSpacesLoading && !error && activeSpaces.length === 0
  const { isOpen: isTrialOpen, setIsOpen: setIsTrialOpen } = useSafeProTrialPrompt(isSafePro && hasNoSpaces)

  const afterSignIn = useCallback(() => {
    setHasSignedIn(true)
  }, [setHasSignedIn])

  const onAddSpaceBtnClick = () =>
    trackEvent(SPACE_EVENTS.WORKSPACE_CREATE_STARTED, { entry_point: WorkspaceCreateEntryPoint.WELCOME })

  const pendingInviteBanners =
    isUserSignedIn && pendingInvites.length > 0
      ? pendingInvites.map((invitingSpace: GetSpaceResponse) => (
          <SpaceListInvite
            key={invitingSpace.uuid}
            space={invitingSpace}
            invitedByName={getInvitedByName(invitingSpace, currentUser?.id)}
          />
        ))
      : null

  return (
    <div className={css.container}>
      <div className={css.mySpaces}>
        <div className={css.spacesHeader}>
          <AccountsNavigation />
        </div>

        {!isStoreHydrated || (isUserSignedIn && isSpacesLoading) ? (
          <div className="flex justify-center py-10">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        ) : !isUserSignedIn ? (
          <SignedOutState afterSignIn={afterSignIn} redirectLoading={redirectLoading} />
        ) : error && !spaces?.length ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Typography color="muted">Couldn&apos;t load your workspaces. Try again, or contact support.</Typography>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : activeSpaces.length > 0 ? (
          <>
            {isSafeProEnabled && <SafeProWorkspacesBanner className="mb-4" />}
            <WelcomeContentCard className="flex flex-col gap-4">
              <div className="flex justify-end">
                <AddSpaceButton
                  size="default"
                  variant="outline"
                  label="Create"
                  disabled={isAtSpacesLimit}
                  onClick={onAddSpaceBtnClick}
                />
              </div>

              {pendingInviteBanners}

              <div className="rounded-lg border border-border bg-card px-4 py-1" data-testid="org-list">
                {activeSpaces.map((space, index) => (
                  <SpaceRow
                    key={space.uuid}
                    space={space}
                    currentUserId={currentUser?.id}
                    showDivider={index < activeSpaces.length - 1}
                  />
                ))}
              </div>
            </WelcomeContentCard>
          </>
        ) : (
          <>
            {isSafeProEnabled && <SafeProWorkspacesBanner className="mb-4" />}
            {pendingInviteBanners}
            <NoSpacesState isAtLimit={isAtSpacesLimit} />
            {isSafePro && (
              <ShadcnProvider dark={isDarkMode}>
                <TrialFlow
                  trialDays={30}
                  activatedHref={AppRoutes.welcome.createSpace}
                  open={isTrialOpen}
                  onOpenChange={setIsTrialOpen}
                />
              </ShadcnProvider>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default SpacesList
