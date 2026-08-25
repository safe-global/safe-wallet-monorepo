import { useSpaceSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { SPACE_REFRESH_OPTIONS } from './refreshOptions'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useIsAdmin } from './useSpaceMembers'

export type AddressBookWriteScope = 'workspace' | 'local'

type AddressBookWriteScopeResult = {
  scope: AddressBookWriteScope
  canRename: boolean
}

export const useAddressBookWriteScope = (address: string, chainIds: string[]): AddressBookWriteScopeResult => {
  const isAdmin = useIsAdmin()
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  // Row components call this once per rendered Safe, so read the space query directly instead of
  // useSpaceSafes(), whose grouping and sorting would run per row just to answer a membership check.
  const { currentData } = useSpaceSafesGetV1Query(
    { spaceId: spaceId ?? '' },
    { skip: !isUserSignedIn || !spaceId, ...SPACE_REFRESH_OPTIONS },
  )

  // One rename, one name, one book: if the workspace holds this Safe on any of the target chains, the
  // name is workspace-owned for the whole group. Splitting per chain would leave half the rename in the
  // local book, which workspace pages filter out on read.
  const isWorkspaceSafe = chainIds.some((chainId) =>
    currentData?.safes[chainId]?.some((safeAddress) => sameAddress(safeAddress, address)),
  )

  return {
    scope: isAdmin && isWorkspaceSafe ? 'workspace' : 'local',
    canRename: !isWorkspaceSafe || isAdmin,
  }
}
