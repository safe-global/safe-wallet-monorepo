import { useEffect } from 'react'
import { usePortfolioClearPortfolioV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import useChains from '@/hooks/useChains'
import { TxEvent, txSubscribe } from '@/services/tx/txEvents'

/**
 * Clears the CGW portfolio snapshot of a Safe once its tx executes, on chains that read summaries.
 * The mutation invalidates the `portfolio` tag, so summaries and `/v1/portfolio` refetch.
 */
const useClearPortfolioOnTx = (): void => {
  const { configs } = useChains()
  const [clearPortfolio] = usePortfolioClearPortfolioV1Mutation()

  useEffect(() => {
    return txSubscribe(TxEvent.SUCCESS, ({ chainId, safeAddress }) => {
      const chain = configs.find((config) => config.chainId === chainId)
      if (!chain || !hasFeature(chain, FEATURES.PORTFOLIO_SUMMARIES)) return

      clearPortfolio({ address: safeAddress, chainId })
    })
  }, [configs, clearPortfolio])
}

export default useClearPortfolioOnTx
