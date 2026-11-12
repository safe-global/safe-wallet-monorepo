import { useMemo } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import usePortfolioSummaries from './usePortfolioSummaries'

/** The portfolio summary of the current Safe on the current chain, when PORTFOLIO_SUMMARIES is enabled there. */
const useSafePortfolioSummary = () => {
  const { safe, safeAddress } = useSafeInfo()
  const { chainId, deployed } = safe

  // Counterfactual Safes are unknown to the Transaction Service, so CGW would drop them
  const safes = useMemo(
    () => (safeAddress && deployed ? [{ chainId, address: safeAddress }] : []),
    [chainId, safeAddress, deployed],
  )
  const { isEnabled, getSummary, isLoading } = usePortfolioSummaries(safes)

  const enabled = safes.length > 0 && isEnabled(chainId)
  const summary = enabled ? getSummary(chainId, safeAddress) : undefined

  return useMemo(
    () => ({ isEnabled: enabled, summary, isLoading: enabled && isLoading }),
    [enabled, summary, isLoading],
  )
}

export default useSafePortfolioSummary
