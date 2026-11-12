import { useEffect } from 'react'
import { refreshPortfolioSummary } from '@safe-global/store/gateway/portfolioSummaries'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useChain } from '@/hooks/useChains'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectCurrency, selectTokenList } from '@/store/settingsSlice'
import { makeSafeTag } from '@/store/api/gateway'
import { isTrustedTokenList } from '@/utils/tokenList'
import usePortfolioSummaries, { type SafeRef } from './usePortfolioSummaries'

// A snapshot CGW refetched right after a cache clear expires within minutes; a regular one lives far longer
export const SETTLE_WINDOW_MAX_MS = 5 * 60_000
export const SETTLE_REFETCH_DELAY_MS = 2_000

const NO_SAFES: SafeRef[] = []

/** Refetches the current Safe's summary once its post-tx snapshot expires, in case Zerion had not indexed the tx. */
const useRefetchSummaryOnSettle = (): void => {
  const { safe, safeAddress } = useSafeInfo()
  const { chainId, deployed } = safe
  const chain = useChain(chainId)
  const currency = useAppSelector(selectCurrency)
  const tokenList = useAppSelector(selectTokenList)
  const dispatch = useAppDispatch()
  // Reads the cached summaries without requesting one, so non-summary pages send nothing
  const { isEnabled, getSummary } = usePortfolioSummaries(NO_SAFES)

  const isSummarySafe = deployed && !!safeAddress && isEnabled(chainId)
  const expiresAt = isSummarySafe ? getSummary(chainId, safeAddress)?.snapshot?.expiresAt : undefined
  const trusted = chain ? isTrustedTokenList(chain, tokenList) : undefined

  useEffect(() => {
    if (!expiresAt || trusted === undefined) return
    const msUntilExpiry = Date.parse(expiresAt) - Date.now()
    if (Number.isNaN(msUntilExpiry) || msUntilExpiry > SETTLE_WINDOW_MAX_MS) return

    const timer = setTimeout(
      () => {
        dispatch(refreshPortfolioSummary({ safes: [makeSafeTag(chainId, safeAddress)], currency, trusted }))
      },
      Math.max(msUntilExpiry, 0) + SETTLE_REFETCH_DELAY_MS,
    )
    return () => clearTimeout(timer)
  }, [expiresAt, trusted, chainId, safeAddress, currency, dispatch])
}

export default useRefetchSummaryOnSettle
