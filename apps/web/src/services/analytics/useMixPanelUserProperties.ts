import { useMemo } from 'react'
import { useChain } from '@/hooks/useChains'
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
  const currentChain = useChain(safe?.chainId || '')
  const txHistory = useAppSelector(selectTxHistory)

  return useMemo(() => {
    if (!safeLoaded || !safe || !currentChain) {
      return null
    }

    // Get current network name from chain
    const currentNetworkName = currentChain.chainName.toLowerCase()

    // Use safe.nonce for total transaction count (represents all executed transactions)
    const totalTxCount = safe.nonce

    // Calculate last transaction timestamp from history (limited to recent transactions)
    let lastTxAt: Date | null = null

    if (txHistory.data?.results) {
      const transactions = txHistory.data.results.filter(isTransactionListItem).map((item) => item.transaction)

      // The first transaction is always the most recent (transactions are sorted by timestamp descending)
      if (transactions.length > 0 && transactions[0].timestamp) {
        lastTxAt = new Date(transactions[0].timestamp)
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
