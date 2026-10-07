import { useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import {
  type SpaceMemberDto,
  useSpaceSafesGetV1Query,
  useSpacesGetOneV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  isAuthenticated,
  selectIsOidcLoginPending,
  selectIsSessionCheckPending,
  selectIsStoreHydrated,
} from '@/store/authSlice'
import { showNotification } from '@/store/notificationsSlice'
import { selectStepUpPhase } from '@/features/oidc-auth/store'
import useChainId from '@/hooks/useChainId'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { parseSpaceId } from '@/hooks/useUrlSpaceId'
import { isUnauthorized } from '../utils'
import { MemberStatus } from './useSpaceMembers'
import { SPACE_REFRESH_OPTIONS } from './refreshOptions'
import { AppRoutes } from '@/config/routes'

/** `none` also covers a check that cannot decide yet because its data is still loading. */
export type SafeWorkspaceAction = 'none' | 'signIn' | 'remove' | 'removeNotMember'

export type SafeWorkspaceState = {
  /** The raw `spaceId` query param, before validation. */
  rawSpaceId: unknown
  isSafeRoute: boolean
  isSessionPending: boolean
  isSignedIn: boolean
  /** The Workspace endpoint answered 401/404: the user is not a member. */
  hasNoAccess: boolean
  /** The membership of the user; undefined while loading, null when the user is not in the member list. */
  membershipStatus: SpaceMemberDto['status'] | null | undefined
  /** Undefined while the Safes of the Workspace or the Safe address are loading. */
  isSafeInSpace: boolean | undefined
}

/** The action for a signed-in user, from the membership and the Safes of the Workspace. */
const getMemberAction = (state: SafeWorkspaceState): SafeWorkspaceAction => {
  if (state.hasNoAccess) return 'removeNotMember'
  if (state.membershipStatus === undefined) return 'none'
  if (state.membershipStatus === MemberStatus.INVITED) return 'none'
  if (state.membershipStatus !== MemberStatus.ACTIVE) return 'removeNotMember'
  if (state.isSafeInSpace === undefined) return 'none'
  return state.isSafeInSpace ? 'none' : 'remove'
}

/** What a Safe page does with the `spaceId` of its URL. A signed-out user keeps it and gets a sign-in prompt. */
export const getSafeWorkspaceAction = (state: SafeWorkspaceState): SafeWorkspaceAction => {
  if (!state.isSafeRoute || state.rawSpaceId === undefined) return 'none'
  if (parseSpaceId(state.rawSpaceId) === null) return 'remove'
  if (state.isSessionPending) return 'none'
  if (!state.isSignedIn) return 'signIn'
  return getMemberAction(state)
}

// Workspace and welcome pages also carry `safe` (e.g. for a modal), but they are not Safe pages
const isWorkspaceOrWelcomePage = (pathname: string): boolean =>
  pathname.startsWith(AppRoutes.spaces.index) || pathname.startsWith(AppRoutes.welcome.index)

const useSafeWorkspaceState = (): SafeWorkspaceState => {
  const { query, isReady, pathname } = useRouter()
  const isSignedIn = useAppSelector(isAuthenticated)
  const isStoreHydrated = useAppSelector(selectIsStoreHydrated)
  const isSessionCheckPending = useAppSelector(selectIsSessionCheckPending)
  const isOidcLoginPending = useAppSelector(selectIsOidcLoginPending)
  // A step-up return replays the add of a new Safe, which a list read before it would miss
  const isStepUpInProgress = useAppSelector(selectStepUpPhase) !== 'idle'
  const chainId = useChainId()
  const safeAddress = useSafeAddressFromUrl()

  const isSafeRoute =
    isReady && typeof query.safe === 'string' && query.safe.length > 0 && !isWorkspaceOrWelcomePage(pathname)
  const spaceId = parseSpaceId(query.spaceId)
  const skip = !isSafeRoute || !isSignedIn || spaceId === null

  const { currentData: user } = useUsersGetWithWalletsV1Query(undefined, { skip })
  const { currentData: space, error: spaceError } = useSpacesGetOneV1Query(
    { id: spaceId ?? '' },
    { skip, ...SPACE_REFRESH_OPTIONS },
  )
  const { currentData: spaceSafes } = useSpaceSafesGetV1Query(
    { spaceId: spaceId ?? '' },
    { skip, ...SPACE_REFRESH_OPTIONS },
  )

  const membershipStatus =
    space && user ? (space.members.find((member) => member.user.id === user.id)?.status ?? null) : undefined
  // useChainId is '' until the chain of the URL resolves; deciding before then would remove a valid id
  const isSafeInSpace =
    spaceSafes && safeAddress && chainId
      ? (spaceSafes.safes[chainId] ?? []).some((address) => sameAddress(address, safeAddress))
      : undefined

  return {
    rawSpaceId: isReady ? query.spaceId : undefined,
    isSafeRoute,
    isSessionPending: !isStoreHydrated || isSessionCheckPending || isOidcLoginPending || isStepUpInProgress,
    isSignedIn,
    hasNoAccess: Boolean(isUnauthorized(spaceError)),
    membershipStatus,
    isSafeInSpace,
  }
}

/** The {@link getSafeWorkspaceAction} of the current page. */
export const useSafeWorkspaceAction = (): SafeWorkspaceAction => getSafeWorkspaceAction(useSafeWorkspaceState())

/** Opens the current page outside any Workspace, without a new history entry. */
export const useRemoveUrlSpaceId = (): (() => void) => {
  const router = useRouter()

  return useCallback(() => {
    const { spaceId: _removed, ...query } = router.query
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })
  }, [router])
}

/**
 * On a Safe page, removes a `spaceId` that the signed-in user cannot use: a malformed id, a
 * Workspace the user is not an active member of, or a Workspace without this Safe. The page then
 * shows the Safe outside any Workspace.
 */
export const useSafeWorkspaceCheck = (): void => {
  const dispatch = useAppDispatch()
  const state = useSafeWorkspaceState()
  const action = getSafeWorkspaceAction(state)
  const removeUrlSpaceId = useRemoveUrlSpaceId()
  // The router can change before the replace completes; act once per id so the notice shows once
  const removedSpaceId = useRef<string | undefined>(undefined)
  const rawSpaceId = String(state.rawSpaceId)

  useEffect(() => {
    if (action !== 'remove' && action !== 'removeNotMember') {
      removedSpaceId.current = undefined
      return
    }
    if (removedSpaceId.current === rawSpaceId) return

    removedSpaceId.current = rawSpaceId
    removeUrlSpaceId()

    if (action === 'removeNotMember') {
      dispatch(
        showNotification({
          message: 'You are not a member of this Workspace, so the Safe opens outside it.',
          variant: 'info',
          groupKey: 'safe-workspace-not-member',
        }),
      )
    }
  }, [action, rawSpaceId, removeUrlSpaceId, dispatch])
}
