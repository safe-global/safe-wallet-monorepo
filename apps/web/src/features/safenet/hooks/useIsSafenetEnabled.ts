import useSafeInfo from '@/hooks/useSafeInfo'
import { useGetSafenetConfigQuery } from '@/store/safenet'
import { sameAddress } from '@/utils/addresses'
import { skipToken } from '@reduxjs/toolkit/query/react'
import useHasSafenetFeature from './useHasSafenetFeature'

/**
 * Checks that the Safenet feature flag is active and the user's Safe is enabled for Safenet
 * @returns {boolean} Whether the Safenet feature is enabled for the user's Safe
 */
export const useIsSafenetEnabled = () => {
  const { safe } = useSafeInfo()
  const chainId = safe.chainId

  const hasSafenetFeature = useHasSafenetFeature()
  const { data: safenetConfig } = useGetSafenetConfigQuery(!hasSafenetFeature ? skipToken : undefined)

  const chainSupportedBySafenet = safenetConfig && safenetConfig.chains.includes(Number(chainId))
  const hasSafenetGuard = sameAddress(safe.guard?.value, safenetConfig?.guards[safe.chainId])
  const hasSafenetModule =
    safe.modules?.length === 1 && sameAddress(safe.modules?.[0].value, safenetConfig?.settlementEngines[safe.chainId])

  if (!hasSafenetFeature) {
    return false
  }

  return chainSupportedBySafenet && hasSafenetGuard && hasSafenetModule
}

export default useIsSafenetEnabled
