import { useMemo } from 'react'
import { type GetSpaceResponse, useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { filterSpacesByStatus } from '../utils'
import { MemberStatus } from './useSpaceMembers'

export type WorkspacesViewKind = 'signed-out' | 'no-workspaces' | 'has-workspaces'

export interface WorkspacesView {
  kind: WorkspacesViewKind
  isLoading: boolean
  activeSpaces: GetSpaceResponse[]
  pendingInvites: GetSpaceResponse[]
}

/**
 * The three states of the "Workspaces" grouping, shared across the welcome screen
 * and the in-safe header dropdown so the workspaces experience stays identical.
 *
 * - `signed-out`: user is not authenticated with a workspace account.
 * - `no-workspaces`: signed in but has no active workspaces.
 * - `has-workspaces`: signed in with at least one active workspace.
 *
 * `isLoading` is true while the spaces query resolves for a signed-in user so
 * callers can avoid flashing the empty state.
 */
export const useWorkspacesView = (): WorkspacesView => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: currentUser, isFetching: isUserFetching } = useUsersGetWithWalletsV1Query(undefined, {
    skip: !isUserSignedIn,
  })
  const {
    currentData: spaces,
    isFetching: isSpacesFetching,
    isUninitialized,
    error,
  } = useSpacesGetV1Query(undefined, { skip: !isUserSignedIn })

  return useMemo<WorkspacesView>(() => {
    if (!isUserSignedIn) {
      return { kind: 'signed-out', isLoading: false, activeSpaces: [], pendingInvites: [] }
    }

    const activeSpaces = filterSpacesByStatus(currentUser, spaces || [], MemberStatus.ACTIVE)
    const pendingInvites = filterSpacesByStatus(currentUser, spaces || [], MemberStatus.INVITED)

    // Mirror SpacesList: treat the skip→unskip lag (spaces still undefined, no
    // error) as loading so a signed-in user never flashes the "no workspaces" card.
    const isLoading = isUserFetching || isSpacesFetching || isUninitialized || (spaces === undefined && !error)

    return {
      kind: activeSpaces.length > 0 ? 'has-workspaces' : 'no-workspaces',
      isLoading,
      activeSpaces,
      pendingInvites,
    }
  }, [isUserSignedIn, currentUser, spaces, isUserFetching, isSpacesFetching, isUninitialized, error])
}

export default useWorkspacesView
