import { useLoadFeature } from '@/features/__core__'
import { MyAccountsFeature } from '@/features/myAccounts'
import SpaceRow from './SpaceRow'
import SignInOptions from '../SignInOptions'
import WorkspaceBanner from '../WorkspaceBanner'
import LocalSafesAlert from './LocalSafesAlert'
import SpacesIcon from '@/public/images/spaces/spaces.svg'
import SafeMarkIcon from '@/public/images/logo-no-text.svg'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { Box, Card, Link, Stack, Typography } from '@mui/material'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography as ShadcnTypography } from '@/components/ui/typography'
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

const AddSpaceButton = ({
  onClick,
  disabled,
  size = 'lg',
  variant = 'default',
  label = 'Create workspace',
}: {
  onClick?: () => void
  disabled?: boolean
  size?: 'lg' | 'default'
  variant?: 'default' | 'outline'
  label?: string
}) => {
  const button = (
    <Button
      data-testid="create-space-button"
      variant={variant}
      size={size}
      className={cn(
        size === 'lg' && 'h-full rounded-lg px-6 py-3 text-base',
        disabled && 'cursor-not-allowed opacity-50 grayscale',
      )}
      render={disabled ? <span /> : <NextLink href={AppRoutes.welcome.createSpace} />}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
    >
      <AddIcon
        className={cn(
          variant === 'default' ? 'fill-primary-foreground' : 'fill-foreground',
          size === 'lg' ? 'size-5' : 'size-4',
        )}
      />
      {label}
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
  const isDarkMode = useDarkMode()

  return (
    <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
      {/* The page keeps its Topbar + Accounts/Workspaces tabs, so the sign-in
          card renders inline rather than as a full-screen takeover. */}
      <div className="relative flex items-center justify-center p-6 py-10">
        <div className="flex w-full max-w-[440px] flex-col items-center">
          <WorkspaceBanner className="mb-3" />

          <div className="relative w-full">
            <div className="relative w-full rounded-lg bg-card p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06)]">
              <div className="mx-auto mb-6 flex size-10 items-center justify-center text-foreground">
                <SafeMarkIcon className="size-10" />
              </div>

              <ShadcnTypography variant="h3" className="mb-6 text-center">
                Sign in to your workspace
              </ShadcnTypography>

              <LocalSafesAlert />

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

const WORKSPACE_BENEFITS = [
  'Organize multiple Safe accounts in one place',
  'Invite members and manage their roles',
  'Share an address book across your team',
]

const NoSpacesState = ({ isAtLimit }: { isAtLimit: boolean }) => {
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false)

  return (
    <>
      <Card sx={{ p: 5, textAlign: 'center', width: 1 }}>
        <Box display="flex" justifyContent="center" mb={2}>
          <SpacesIcon />
        </Box>

        <Typography variant="h4" fontWeight="bold" mb={1}>
          Create your first workspace
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Collaborate on your Safe accounts with your team.
        </Typography>

        <Stack spacing={1.5} sx={{ mx: 'auto', mb: 4, maxWidth: 360, textAlign: 'left' }}>
          {WORKSPACE_BENEFITS.map((benefit) => (
            <Stack key={benefit} direction="row" spacing={1.5} alignItems="center">
              <Check className="size-4 shrink-0 text-primary" />
              <Typography variant="body2">{benefit}</Typography>
            </Stack>
          ))}
        </Stack>

        <div className="h-12">
          <AddSpaceButton
            disabled={isAtLimit}
            onClick={() =>
              trackEvent(SPACE_EVENTS.WORKSPACE_CREATE_STARTED, { entry_point: WorkspaceCreateEntryPoint.WELCOME })
            }
          />
        </div>

        <Box mt={2}>
          <Link onClick={() => setIsInfoOpen(true)} href="#">
            What are workspaces?
          </Link>
        </Box>
      </Card>
      {isInfoOpen && <SpaceInfoModal onClose={() => setIsInfoOpen(false)} />}
    </>
  )
}

const SpacesList = () => {
  const { AccountsNavigation } = useLoadFeature(MyAccountsFeature)
  const isDarkMode = useDarkMode()
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
  const isAtSpacesLimit = activeSpaces.length >= SPACES_LIMIT

  const singleSpaceId = activeSpaces.length === 1 ? activeSpaces[0].uuid : null

  const { setHasSignedIn, redirectLoading } = useSignInRedirect({
    spacesAmount: spaces?.length || 0,
    inviteAmount: pendingInvites.length,
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

  const onAddSpaceBtnClick = () =>
    trackEvent(SPACE_EVENTS.WORKSPACE_CREATE_STARTED, { entry_point: WorkspaceCreateEntryPoint.WELCOME })

  return (
    <Box className={css.container}>
      <Box className={css.mySpaces}>
        <Box className={css.spacesHeader}>
          <AccountsNavigation />
        </Box>

        {isUserSignedIn && activeSpaces.length > 0 && (
          <div className={cn('shadcn-scope mb-4 flex justify-end', isDarkMode && 'dark')}>
            <AddSpaceButton
              size="default"
              variant="outline"
              label="Create"
              disabled={isAtSpacesLimit}
              onClick={onAddSpaceBtnClick}
            />
          </div>
        )}

        {isUserSignedIn &&
          pendingInvites.length > 0 &&
          pendingInvites.map((invitingSpace: GetSpaceResponse) => (
            <SpaceListInvite
              key={invitingSpace.uuid}
              space={invitingSpace}
              invitedByName={getInvitedByName(invitingSpace, currentUser?.id)}
            />
          ))}

        {!isUserSignedIn ? (
          <SignedOutState afterSignIn={afterSignIn} redirectLoading={redirectLoading} />
        ) : activeSpaces.length > 0 ? (
          <div className={cn('shadcn-scope', isDarkMode && 'dark')}>
            <div className="rounded-3xl bg-card px-4 py-1" data-testid="org-list">
              {activeSpaces.map((space, index) => (
                <SpaceRow
                  key={space.uuid}
                  space={space}
                  currentUserId={currentUser?.id}
                  showDivider={index < activeSpaces.length - 1}
                />
              ))}
            </div>
          </div>
        ) : (
          <NoSpacesState isAtLimit={isAtSpacesLimit} />
        )}
      </Box>
    </Box>
  )
}

export default SpacesList
