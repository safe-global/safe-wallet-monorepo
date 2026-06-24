import { useContext, useMemo } from 'react'
import { calculateSafeTransactionHash } from '@safe-global/protocol-kit'
import useSafeInfo from '@/hooks/useSafeInfo'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { hnSecurityReportBtnConfig } from '../components/HnSecurityReportBtn/config'
import { buildSecurityReportUrl } from '../utils/buildSecurityReportUrl'

/**
 * Build the Hypernative security report URL for the SafeShield panel.
 * Computes safeTxHash from the SafeTransaction in SafeTxContext.
 * Returns null when no transaction is available or the hash cannot be computed.
 */
export const useSafeShieldAssessmentUrl = (): string | null => {
  const { safeTx } = useContext(SafeTxContext)
  const { safeAddress, safe } = useSafeInfo()

  return useMemo(() => {
    if (!safeTx?.data || !safe.version) return null
    try {
      const safeTxHash = calculateSafeTransactionHash(safeAddress, safeTx.data, safe.version, BigInt(safe.chainId))
      return buildSecurityReportUrl(hnSecurityReportBtnConfig.baseUrl, safe.chainId, safeAddress, safeTxHash)
    } catch {
      return null
    }
  }, [safeTx, safeAddress, safe.chainId, safe.version])
}
