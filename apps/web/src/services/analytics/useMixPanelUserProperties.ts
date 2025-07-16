import { useMemo } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useAppSelector } from '@/store'
import { selectTxHistory } from '@/store/txHistorySlice'
import { isTransactionListItem } from '@/utils/transaction-guards'
import { MixPanelUserProperty } from '@/services/analytics/mixpanel-events'

export interface MixPanelUserProperties {
  safe_address: string
  safe_version: string
  num_signers: number
  threshold: number
  networks: string[]
  total_tx_count: number
  last_tx_at: Date | null
}

export interface MixPanelUserPropertiesFormatted {
  properties: Record<string, any>
  networks: string[]
}

/**
 * Hook to get formatted user properties for MixPanel tracking
 *
 * This hook collects Safe-related user properties that can be used for
 * MixPanel user attribute tracking and cohort analysis.
 * Returns both regular properties and networks separately for different MixPanel operations.
 */
export const useMixPanelUserProperties = (): MixPanelUserPropertiesFormatted | null => {
  const { safe, safeLoaded } = useSafeInfo()
  const currentChain = useCurrentChain()
  const txHistory = useAppSelector(selectTxHistory)

  return useMemo(() => {
    if (!safeLoaded || !safe || !currentChain) {
      return null
    }

    // Get current network name from chain
    const currentNetworkName = currentChain.chainName.toLowerCase()

    // Calculate transaction count and last transaction from history
    let totalTxCount = 0
    let lastTxAt: Date | null = null

    if (txHistory.data?.results) {
      const transactions = txHistory.data.results.filter(isTransactionListItem).map((item) => item.transaction)

      totalTxCount = transactions.length

      // Find the most recent transaction timestamp
      if (transactions.length > 0) {
        const timestamps = transactions
          .map((tx) => tx.timestamp)
          .filter((timestamp) => timestamp !== null)
          .sort((a, b) => b - a) // Sort descending (most recent first)

        if (timestamps.length > 0) {
          lastTxAt = new Date(timestamps[0])
        }
      }
    }

    // Create networks array with current network
    // Note: This starts with current network, but should be extended to include
    // all networks where this Safe has been active. For now, we append the current
    // network to any existing networks to avoid overwriting.
    const networks = [currentNetworkName]

    // Create MixPanel properties object with string keys
    const properties = {
      [MixPanelUserProperty.SAFE_ADDRESS]: safe.address.value,
      [MixPanelUserProperty.SAFE_VERSION]: safe.version || 'unknown',
      [MixPanelUserProperty.NUM_SIGNERS]: safe.owners.length,
      [MixPanelUserProperty.THRESHOLD]: safe.threshold,
      [MixPanelUserProperty.TOTAL_TX_COUNT]: totalTxCount,
      [MixPanelUserProperty.LAST_TX_AT]: lastTxAt?.toISOString() || null,
    }

    return {
      properties,
      networks,
    }
  }, [safe, safeLoaded, currentChain, txHistory])
}
