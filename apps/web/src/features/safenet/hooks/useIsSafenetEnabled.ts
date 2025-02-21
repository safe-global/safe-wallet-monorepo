import useSafeInfo from '@/hooks/useSafeInfo'
import { useGetSafenetConfigQuery } from '@/store/safenet'
import { sameAddress } from '@/utils/addresses'
import { skipToken } from '@reduxjs/toolkit/query/react'
import useHasSafenetFeature from './useHasSafenetFeature'

/**
 * Checks that the Safenet feature flag is active and the user's Safe is enabled for Safenet
 * @returns {boolean} Whether the Safenet feature is enabled for the user's Safe
 */
const useIsSafenetEnabled = () => {
  const { safe } = useSafeInfo()
  const hasSafenetFeature = useHasSafenetFeature()
  const { data: safenetConfig } = useGetSafenetConfigQuery(!hasSafenetFeature ? skipToken : undefined)

  if (!hasSafenetFeature) {
    return false
  }

  return (
    sameAddress(safe.guard?.value, safenetConfig?.guards[safe.chainId]) &&
    safe.modules?.length === 1 &&
    sameAddress(safe.modules?.[0].value, safenetConfig?.settlementEngines[safe.chainId])
  )
}

export default useIsSafenetEnabled
