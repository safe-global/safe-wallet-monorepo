import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useIsHypernativeEligible } from './useIsHypernativeEligible'
import { useIsHypernativeFeature } from './useIsHypernativeFeature'
import { useIsHypernativeQueueScanFeature } from './useIsHypernativeQueueScanFeature'

interface UseShowHypernativeAssessmentParams {
  isQueue: boolean
  safeTxHash: string | undefined
}

/**
 * Hook to determine if Hypernative assessment should be shown
 *
 * @param isQueue - Whether the transaction is in queue
 * @param safeTxHash - The safeTxHash of the transaction
 * @returns Boolean indicating if assessment should be shown
 */
export const useShowHypernativeAssessment = ({ isQueue, safeTxHash }: UseShowHypernativeAssessmentParams): boolean => {
  const { safe } = useSafeInfo()
  const chainId = safe.chainId
  const isHypernativeFeatureEnabled = useIsHypernativeFeature()
  const { isHypernativeEligible, loading: hnEligibilityLoading } = useIsHypernativeEligible()
  const isHypernativeQueueScanEnabled = useIsHypernativeQueueScanFeature()
  const isSafeOwner = useIsSafeOwner()

  if (
    !isQueue ||
    !isHypernativeFeatureEnabled ||
    !isHypernativeQueueScanEnabled ||
    !isHypernativeEligible ||
    hnEligibilityLoading ||
    !safeTxHash ||
    !chainId ||
    !isSafeOwner
  ) {
    return false
  }

  return true
}
