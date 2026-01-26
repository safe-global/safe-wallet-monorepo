import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useIsHypernativeEligible } from './useIsHypernativeEligible'
import { useIsHypernativeQueueScanFeature } from './useIsHypernativeQueueScanFeature'

/**
 * Hook to determine if Hypernative assessment should be shown
 *
 * @returns Boolean indicating if assessment should be shown
 */
export const useShowHypernativeAssessment = (): boolean => {
  const { safe } = useSafeInfo()
  const chainId = safe.chainId
  const { isHypernativeEligible, loading: hnEligibilityLoading } = useIsHypernativeEligible()
  const isHypernativeQueueScanEnabled = useIsHypernativeQueueScanFeature()
  const isSafeOwner = useIsSafeOwner()

  if (!isHypernativeQueueScanEnabled || !isHypernativeEligible || hnEligibilityLoading || !chainId || !isSafeOwner) {
    return false
  }

  return true
}
