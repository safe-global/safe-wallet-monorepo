import { useSpaceSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { SPACE_REFRESH_OPTIONS } from './refreshOptions'

/** True when the Safe on this chain is in the Workspace of the URL; false outside a Workspace or while it loads. */
export const useIsSafeInCurrentSpace = (chainId: string, safeAddress: string): boolean => {
  const spaceId = useCurrentSpaceId()
  const isSignedIn = useAppSelector(isAuthenticated)
  const { currentData: spaceSafes } = useSpaceSafesGetV1Query(
    { spaceId: spaceId ?? '' },
    { skip: !isSignedIn || !spaceId, ...SPACE_REFRESH_OPTIONS },
  )

  const chainSafes = spaceSafes?.safes[chainId] ?? []
  return chainSafes.some((address) => sameAddress(address, safeAddress))
}
