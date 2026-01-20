import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useIsHypernativeEligible } from './useIsHypernativeEligible'

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
  const { isHypernativeEligible, loading: hnEligibilityLoading } = useIsHypernativeEligible()
  const isSafeOwner = useIsSafeOwner()

  if (!isQueue || !isHypernativeEligible || hnEligibilityLoading || !safeTxHash || !chainId || !isSafeOwner) {
    return false
  }

  return true
}
