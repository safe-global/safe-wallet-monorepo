import { useIsHypernativeGuard } from './useIsHypernativeGuard'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useSafeInfo from '@/hooks/useSafeInfo'

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
  const { isHypernativeGuard, loading: hnGuardLoading } = useIsHypernativeGuard()
  const isSafeOwner = useIsSafeOwner()

  if (!isQueue || !isHypernativeGuard || !safeTxHash || !chainId || !isSafeOwner || hnGuardLoading) {
    return false
  }

  return true
}
