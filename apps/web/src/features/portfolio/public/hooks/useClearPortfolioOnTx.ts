import { useEffect, useRef } from 'react'
import {
  refreshPortfolioSummary,
  usePortfolioClearForSummaryMutation,
} from '@safe-global/store/gateway/portfolioSummaries'
import type { PortfolioSummary } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import useChains from '@/hooks/useChains'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectCurrency, selectTokenList } from '@/store/settingsSlice'
import { makeSafeTag } from '@/store/api/gateway'
import { isTrustedTokenList } from '@/utils/tokenList'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'

// After a clear, CGW keeps the refetched snapshot only until its settle window ends (Zerion may lag behind the tx)
export const SETTLE_WINDOW_MAX_MS = 5 * 60_000
export const SETTLE_REFETCH_DELAY_MS = 2_000

// From the snapshot's server-side lifetime, so a client clock offset doesn't shift the re-read
const getSettleRefetchDelay = (
  summaries: PortfolioSummary[] | undefined,
  chainId: string,
  safeAddress: string,
): number | undefined => {
  const snapshot = summaries?.find(
    (summary) => summary.chainId === chainId && sameAddress(summary.address, safeAddress),
  )?.snapshot
  if (!snapshot) return undefined
  const lifetimeMs = Date.parse(snapshot.expiresAt) - Date.parse(snapshot.updatedAt)
  if (Number.isNaN(lifetimeMs) || lifetimeMs <= 0 || lifetimeMs > SETTLE_WINDOW_MAX_MS) return undefined
  return lifetimeMs + SETTLE_REFETCH_DELAY_MS
}

/** On a summaries chain, clears an executed Safe's CGW cache, refetches its summary, and re-reads it once it settles. */
const useClearPortfolioOnTx = (): void => {
  const { configs } = useChains()
  const currency = useAppSelector(selectCurrency)
  const tokenList = useAppSelector(selectTokenList)
  const dispatch = useAppDispatch()
  const [clearPortfolio] = usePortfolioClearForSummaryMutation()
  // One pending re-read per Safe; a currency or token list change (or unmount) drops them, even mid-request
  const settle = useRef({ timers: new Map<string, ReturnType<typeof setTimeout>>(), generation: 0 })

  useEffect(() => {
    const state = settle.current
    return () => {
      state.generation += 1
      state.timers.forEach(clearTimeout)
      state.timers.clear()
    }
  }, [currency, tokenList])

  useEffect(() => {
    return txSubscribe(TxEvent.SUCCESS, async ({ chainId, safeAddress }) => {
      const chain = configs.find((config) => config.chainId === chainId)
      if (!chain || !hasFeature(chain, FEATURES.PORTFOLIO_SUMMARIES)) return

      const state = settle.current
      const generation = state.generation
      const result = await clearPortfolio({ address: safeAddress, chainId })
      if ('error' in result) return

      const safeTag = makeSafeTag(chainId, safeAddress)
      const arg = { safes: [safeTag], currency, trusted: isTrustedTokenList(chain, tokenList) }
      const summaries = await dispatch(refreshPortfolioSummary(arg))

      const delay = getSettleRefetchDelay(summaries, chainId, safeAddress)
      if (delay === undefined || generation !== state.generation) return
      clearTimeout(state.timers.get(safeTag))
      state.timers.set(
        safeTag,
        setTimeout(() => {
          state.timers.delete(safeTag)
          dispatch(refreshPortfolioSummary(arg))
        }, delay),
      )
    })
  }, [configs, clearPortfolio, dispatch, currency, tokenList])
}

export default useClearPortfolioOnTx
