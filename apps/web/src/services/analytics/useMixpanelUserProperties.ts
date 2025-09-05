import { useMemo } from 'react'
import { useChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector } from '@/store'
import { selectTxHistory } from '@/store/txHistorySlice'
import { isTransactionListItem } from '@/utils/transaction-guards'
import { MixpanelUserProperty } from '@/services/analytics/mixpanel-events'
import { useNetworksOfSafe } from '@/features/myAccounts/hooks/useNetworksOfSafe'

export interface MixpanelUserProperties {
  safe_address: string
  safe_version: string
  num_signers: number
  threshold: number
  networks: string[]
  total_tx_count: number
  last_tx_at: Date | null
}

export interface MixpanelUserPropertiesFormatted {
  properties: Record<string, any>
  networks: string[]
}

/**
 * Hook to get formatted user properties for Mixpanel tracking
 *
 * This hook collects Safe-related user properties that can be used for
 * Mixpanel user attribute tracking and cohort analysis.
 * Returns both regular properties and networks separately for different Mixpanel operations.
 */
export const useMixpanelUserProperties = (): MixpanelUserPropertiesFormatted | null => {
  const { safe, safeLoaded } = useSafeInfo()
  const currentChain = useChain(safe?.chainId || '')
  const txHistory = useAppSelector(selectTxHistory)
  const allNetworks = useNetworksOfSafe(safe?.address?.value || '')

  return useMemo(() => {
    if (!safeLoaded || !safe || !currentChain) {
      return null
    }

    const networks = allNetworks.length > 0 ? allNetworks : [currentChain.chainName]

    const totalTxCount = safe.nonce

    let lastTxAt: Date | null = null

    if (txHistory.data?.results) {
      const transactions = txHistory.data.results.filter(isTransactionListItem).map((item) => item.transaction)

      if (transactions.length > 0 && transactions[0].timestamp) {
        lastTxAt = new Date(transactions[0].timestamp)
      }
    }

    const properties = {
      [MixpanelUserProperty.SAFE_ADDRESS]: safe.address.value,
      [MixpanelUserProperty.SAFE_VERSION]: safe.version || 'unknown',
      [MixpanelUserProperty.NUM_SIGNERS]: safe.owners.length,
      [MixpanelUserProperty.THRESHOLD]: safe.threshold,
      [MixpanelUserProperty.TOTAL_TX_COUNT]: totalTxCount,
      [MixpanelUserProperty.LAST_TX_AT]: lastTxAt?.toISOString() || null,
      [MixpanelUserProperty.NETWORKS]: networks,
    }

    return {
      properties,
      networks,
    }
  }, [safe, safeLoaded, currentChain, txHistory, allNetworks])
}
