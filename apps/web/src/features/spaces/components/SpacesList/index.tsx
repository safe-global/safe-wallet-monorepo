import { useLoadFeature } from '@/features/__core__'
import { MyAccountsFeature } from '@/features/myAccounts'
import { SafeProFeature, useIsSafeProAnnouncementEnabled } from '@/features/safe-pro-announcement'
import SpaceRow from './SpaceRow'
import SignInOptions from '../SignInOptions'
import WorkspaceBanner from '../WorkspaceBanner'
import { useAppSelector } from '@/store'
import { isAuthenticated, selectIsStoreHydrated } from '@/store/authSlice'
import { type GetSpaceResponse, useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import SpaceListInvite from '../InviteBanner'
import { useCallback, useState } from 'react'
import { useDarkMode } from '@/hooks/useDarkMode'
import { MemberStatus } from '@/features/spaces'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { trackEvent } from '@/services/analytics'
import { WorkspaceCreateEntryPoint } from '@/services/analytics/mixpanel-events'
import SpaceInfoModal from '../SpaceInfoModal'
import { filterSpacesByStatus, getInvitedByName } from '@/features/spaces/utils'
import { SAFE_PRO_USER_TERMS_URL } from '@/config/constants'
import { useIsSafeProEnabled } from '@/hooks/useIsSafeProEnabled'
import { useSignInRedirect } from '@/components/welcome/WelcomeLogin/hooks/useSignInRedirect'
import { SPACES_LIMIT } from '@/features/spaces/constants'
import { useUrlSpaceId } from '@/hooks/useUrlSpaceId'
import {
  NoSpacesStateView,
  SignedOutStateView,
  SpacesListView,
} from '@views/features/spaces/components/SpacesList/SpacesListView'

const SignedOutState = ({ afterSignIn, redirectLoading }: { afterSignIn: () => void; redirectLoading: boolean }) => {
  const isDarkMode = useDarkMode()
  const isSafeProAnnouncementEnabled = useIsSafeProAnnouncementEnabled()
  // The Safe Pro terms only apply once Safe Pro is live.
  const isSafePro = useIsSafeProEnabled()
  const { SafeProBanner } = useLoadFeature(SafeProFeature)

  return (
    <SignedOutStateView
      isDarkMode={isDarkMode}
      isSafeProAnnouncementEnabled={isSafeProAnnouncementEnabled}
      isSafePro={isSafePro}
      safeProUserTermsUrl={SAFE_PRO_USER_TERMS_URL}
      renderSafeProBanner={(props) => <SafeProBanner {...props} />}
      renderWorkspaceBanner={(props) => <WorkspaceBanner {...props} />}
      signInOptions={<SignInOptions afterSignIn={afterSignIn} redirectLoading={redirectLoading} />}
    />
  )
}

const NoSpacesState = ({ isAtLimit }: { isAtLimit: boolean }) => {
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false)
  const isDarkMode = useDarkMode()
  const isSafePro = useIsSafeProEnabled()

  return (
    <NoSpacesStateView
      isAtLimit={isAtLimit}
      spacesLimit={SPACES_LIMIT}
      isDarkMode={isDarkMode}
      isSafePro={isSafePro}
      onCreateClick={() =>
        trackEvent(SPACE_EVENTS.WORKSPACE_CREATE_STARTED, {
          entry_point: WorkspaceCreateEntryPoint.EMPTY_STATE,
        })
      }
      onInfoOpen={() => setIsInfoOpen(true)}
      infoModal={isInfoOpen && <SpaceInfoModal onClose={() => setIsInfoOpen(false)} />}
    />
  )
}

const SpacesList = () => {
  const { AccountsNavigation } = useLoadFeature(MyAccountsFeature)
  const { SafeProWorkspacesBanner } = useLoadFeature(SafeProFeature)
  const isSafeProAnnouncementEnabled = useIsSafeProAnnouncementEnabled()
  // The pre-launch heads-up only makes sense to a user without a Workspace while Safe Pro is not live yet.
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
  const urlSpaceId = useUrlSpaceId()
  const requestedSpaceId = activeSpaces.some((space) => space.uuid === urlSpaceId) ? urlSpaceId : null

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
    requestedSpaceId,
  })

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

  const status =
    !isStoreHydrated || (isUserSignedIn && isSpacesLoading)
      ? 'loading'
      : !isUserSignedIn
        ? 'signed-out'
        : error && !spaces?.length
          ? 'error'
          : activeSpaces.length > 0
            ? 'list'
            : 'empty'

  return (
    <SpacesListView
      status={status}
      accountsNavigation={<AccountsNavigation />}
      signedOutState={<SignedOutState afterSignIn={afterSignIn} redirectLoading={redirectLoading} />}
      noSpacesState={<NoSpacesState isAtLimit={isAtSpacesLimit} />}
      isSafeProAnnouncementEnabled={isSafeProAnnouncementEnabled}
      renderSafeProWorkspacesBanner={(props) => <SafeProWorkspacesBanner {...props} />}
      isAtSpacesLimit={isAtSpacesLimit}
      spacesLimit={SPACES_LIMIT}
      onAddSpaceClick={onAddSpaceBtnClick}
      onRetry={() => refetch()}
      pendingInviteBanners={pendingInviteBanners}
      spaceRows={activeSpaces.map((space, index) => (
        <SpaceRow
          key={space.uuid}
          space={space}
          currentUserId={currentUser?.id}
          showDivider={index < activeSpaces.length - 1}
        />
      ))}
    />
  )
}

export default SpacesList
