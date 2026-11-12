import { useEffect } from 'react'
import {
  refreshPortfolioSummary,
  usePortfolioClearForSummaryMutation,
} from '@safe-global/store/gateway/portfolioSummaries'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import useChains from '@/hooks/useChains'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectCurrency, selectTokenList } from '@/store/settingsSlice'
import { makeSafeTag } from '@/store/api/gateway'
import { isTrustedTokenList } from '@/utils/tokenList'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'

/** On a summaries chain, clears an executed Safe's CGW portfolio cache, then refetches that Safe's summary only. */
const useClearPortfolioOnTx = (): void => {
  const { configs } = useChains()
  const currency = useAppSelector(selectCurrency)
  const tokenList = useAppSelector(selectTokenList)
  const dispatch = useAppDispatch()
  const [clearPortfolio] = usePortfolioClearForSummaryMutation()

  useEffect(() => {
    return txSubscribe(TxEvent.SUCCESS, async ({ chainId, safeAddress }) => {
      const chain = configs.find((config) => config.chainId === chainId)
      if (!chain || !hasFeature(chain, FEATURES.PORTFOLIO_SUMMARIES)) return

      const result = await clearPortfolio({ address: safeAddress, chainId })
      if ('error' in result) return

      await dispatch(
        refreshPortfolioSummary({
          safes: [makeSafeTag(chainId, safeAddress)],
          currency,
          trusted: isTrustedTokenList(chain, tokenList),
        }),
      )
    })
  }, [configs, clearPortfolio, dispatch, currency, tokenList])
}

export default useClearPortfolioOnTx
