import { useMemo } from 'react'
import { useSpaceSafesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useHasFeature } from '@/hooks/useChains'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { isLivePlanStatus } from './billing/subscription'
import { useCurrentSpaceId } from './useCurrentSpaceId'
import { useSpacePlan } from './useSpacePlan'

/** Pro features need the Safe in the current Workspace with a live plan; all stays open while SAFE_PRO is off. */
export const useSafeProAccess = (): {
  hasProFeatures: boolean
  isSafePro: boolean
  isLoading: boolean
  spaceId: string | null
} => {
  const isSafePro = useHasFeature(FEATURES.SAFE_PRO) === true
  const isSignedIn = useAppSelector(isAuthenticated)
  const spaceId = useCurrentSpaceId()
  const chainId = useChainId()
  const safeAddress = useSafeAddress()
  const { currentData: spaceSafes, isLoading: isSafesLoading } = useSpaceSafesGetV1Query(
    { spaceId: spaceId ?? '' },
    { skip: !isSafePro || !isSignedIn || !spaceId },
  )
  const { status, isLoading: isPlanLoading } = useSpacePlan(spaceId)

  const isSafeInSpace = useMemo(
    () => (spaceSafes?.safes[chainId] ?? []).some((address) => sameAddress(address, safeAddress)),
    [spaceSafes, chainId, safeAddress],
  )

  if (!isSafePro) return { hasProFeatures: true, isSafePro, isLoading: false, spaceId: null }

  return {
    hasProFeatures: isSafeInSpace && isLivePlanStatus(status),
    isSafePro,
    isLoading: isSafesLoading || isPlanLoading,
    // The Workspace an upgrade would apply to: the current one, and only while it holds this Safe.
    spaceId: isSafeInSpace ? spaceId : null,
  }
}
