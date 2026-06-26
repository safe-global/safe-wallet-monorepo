import { useCallback, useState } from 'react'
import type { SafeTransaction } from '@safe-global/types-kit'
import { useAppDispatch, useAppSelector } from '@/store'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import useTxPreview from '@/components/tx/confirmation-views/useTxPreview'
import { setTxAiInsight, selectTxAiInsight } from './store'
import { buildTxAiInsightRequest } from './buildTxAiInsightRequest'
import { fetchTxAiInsight, isTxAiInsightsConfigured } from './service'
import type { TxAiInsight } from './types'

export type UseTxAiInsightResult = {
  insight?: TxAiInsight
  /** True when the shown insight was generated for a different (older) tx state than the current one. */
  isStale: boolean
  isLoading: boolean
  error?: Error
  isConfigured: boolean
  generate: () => Promise<void>
}

/**
 * Drives the transaction AI insight box. Reads the cached insight for the current safeTxHash, and
 * keeps the last generated key so a changed tx still shows the previous insight flagged as stale.
 */
export const useTxAiInsight = (safeTxData: SafeTransaction['data'], safeTxHash?: string): UseTxAiInsightResult => {
  const dispatch = useAppDispatch()
  const chainId = useChainId()
  const { safeAddress } = useSafeInfo()
  const [txPreview] = useTxPreview(safeTxData)

  const [generatedHash, setGeneratedHash] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error>()

  const currentInsight = useAppSelector((state) => selectTxAiInsight(state, chainId, safeTxHash))
  const lastInsight = useAppSelector((state) => selectTxAiInsight(state, chainId, generatedHash))

  const insight = currentInsight ?? lastInsight
  const isStale = !currentInsight && !!lastInsight

  const generate = useCallback(async () => {
    if (!safeTxHash) return

    setIsLoading(true)
    setError(undefined)

    try {
      const request = buildTxAiInsightRequest({ chainId, safeAddress, safeTxHash, safeTxData, txPreview })
      const response = await fetchTxAiInsight(request)
      const stored: TxAiInsight = { ...response, safeTxHash, generatedAt: Date.now() }
      dispatch(setTxAiInsight({ chainId, insight: stored }))
      setGeneratedHash(safeTxHash)
    } catch (e) {
      setError(e as Error)
    } finally {
      setIsLoading(false)
    }
  }, [chainId, safeAddress, safeTxHash, safeTxData, txPreview, dispatch])

  return {
    insight,
    isStale,
    isLoading,
    error,
    isConfigured: isTxAiInsightsConfigured(),
    generate,
  }
}
