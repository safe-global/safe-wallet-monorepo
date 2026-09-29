import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useSpaceSafesGetV1Query, useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
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
import useChainId from '@/hooks/useChainId'
import { useSafeAddressFromUrl } from '@/hooks/useSafeAddressFromUrl'
import { parseSpaceId } from '@/hooks/useUrlSpaceId'
import { isUnauthorized } from '../utils'
import { MemberStatus } from './useSpaceMembers'
import { SPACE_REFRESH_OPTIONS } from './refreshOptions'

export type SafeWorkspaceAction = 'none' | 'wait' | 'remove' | 'removeNotMember'

export type SafeWorkspaceState = {
  /** The raw `spaceId` query param, before validation. */
  rawSpaceId: unknown
  isSafeRoute: boolean
  isSessionPending: boolean
  isSignedIn: boolean
  /** The Workspace endpoint answered 401/404: the user is not a member. */
  hasNoAccess: boolean
  /** The membership of the user; undefined while loading, null when the user is not in the member list. */
  membershipStatus: string | null | undefined
  /** Undefined while the Safes of the Workspace or the Safe address are loading. */
  isSafeInSpace: boolean | undefined
}

/** What a Safe page does with the `spaceId` of its URL. A signed-out user keeps it for a later sign-in. */
export const getSafeWorkspaceAction = (state: SafeWorkspaceState): SafeWorkspaceAction => {
  if (!state.isSafeRoute || state.rawSpaceId === undefined) return 'none'
  if (parseSpaceId(state.rawSpaceId) === null) return 'remove'
  if (state.isSessionPending) return 'wait'
  if (!state.isSignedIn) return 'none'
  if (state.hasNoAccess) return 'removeNotMember'
  if (state.membershipStatus === undefined) return 'wait'
  if (state.membershipStatus === MemberStatus.INVITED) return 'none'
  if (state.membershipStatus !== MemberStatus.ACTIVE) return 'removeNotMember'
  if (state.isSafeInSpace === undefined) return 'wait'
  return state.isSafeInSpace ? 'none' : 'remove'
}

const useSafeWorkspaceState = (): SafeWorkspaceState => {
  const { query, isReady } = useRouter()
  const isSignedIn = useAppSelector(isAuthenticated)
  const isStoreHydrated = useAppSelector(selectIsStoreHydrated)
  const isSessionCheckPending = useAppSelector(selectIsSessionCheckPending)
  const isOidcLoginPending = useAppSelector(selectIsOidcLoginPending)
  const chainId = useChainId()
  const safeAddress = useSafeAddressFromUrl()

  const isSafeRoute = isReady && typeof query.safe === 'string' && query.safe.length > 0
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
  const isSafeInSpace =
    spaceSafes && safeAddress
      ? (spaceSafes.safes[chainId] ?? []).some((address) => sameAddress(address, safeAddress))
      : undefined

  return {
    rawSpaceId: isReady ? query.spaceId : undefined,
    isSafeRoute,
    isSessionPending: !isStoreHydrated || isSessionCheckPending || isOidcLoginPending,
    isSignedIn,
    hasNoAccess: Boolean(isUnauthorized(spaceError)),
    membershipStatus,
    isSafeInSpace,
  }
}

/**
 * On a Safe page, removes a `spaceId` that the signed-in user cannot use: a malformed id, a
 * Workspace the user is not an active member of, or a Workspace without this Safe. The page then
 * shows the Safe outside any Workspace.
 */
export const useSafeWorkspaceCheck = (): void => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const action = getSafeWorkspaceAction(useSafeWorkspaceState())

  useEffect(() => {
    if (action !== 'remove' && action !== 'removeNotMember') return

    const { spaceId: _removed, ...query } = router.query
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true })

    if (action === 'removeNotMember') {
      dispatch(
        showNotification({
          message: 'You are not a member of this Workspace, so the Safe opens outside it.',
          variant: 'info',
          groupKey: 'safe-workspace-not-member',
        }),
      )
    }
  }, [action, router, dispatch])
}
