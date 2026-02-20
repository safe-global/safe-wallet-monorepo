import { useMemo } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import { hnSecurityReportBtnConfig } from '../components/HnSecurityReportBtn/config'
import { buildSecurityReportUrl } from '../utils/buildSecurityReportUrl'

/**
 * Hook to build the Hypernative security assessment URL for a transaction
 * @param safeTxHash - The transaction hash
 * @returns The complete security report URL
 */
export const useAssessmentUrl = (safeTxHash: string): string => {
  const { safeAddress, safe } = useSafeInfo()
  const chainId = safe.chainId

  return useMemo(
    () => buildSecurityReportUrl(hnSecurityReportBtnConfig.baseUrl, chainId, safeAddress, safeTxHash),
    [chainId, safeAddress, safeTxHash],
  )
}
