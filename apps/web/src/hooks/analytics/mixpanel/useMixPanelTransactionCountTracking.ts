import { useEffect, useRef } from 'react'
import { setMixPanelUserAttributes } from '@/services/analytics/mixpanel-tracking'
import type { SafeUserAttributes } from '@/services/analytics/types'

interface UseMixPanelTransactionCountTrackingParams {
  isMixPanelEnabled: boolean
  isIdentified: boolean
  userAttributes: SafeUserAttributes | null
  txHistory: any // You may want to type this properly
}

/**
 * Hook to track transaction count changes
 */
export const useMixPanelTransactionCountTracking = ({
  isMixPanelEnabled,
  isIdentified,
  userAttributes,
  txHistory,
}: UseMixPanelTransactionCountTrackingParams) => {
  const lastTxCountRef = useRef<number>(0)

  useEffect(() => {
    if (!isMixPanelEnabled || !isIdentified || !userAttributes) return

    const hasTxCountChanged = lastTxCountRef.current !== userAttributes.total_tx_count

    if (hasTxCountChanged) {
      // Update transaction-related attributes
      setMixPanelUserAttributes({
        ...userAttributes,
        total_tx_count: userAttributes.total_tx_count,
        last_tx_at: userAttributes.last_tx_at,
      })

      lastTxCountRef.current = userAttributes.total_tx_count
    }
  }, [isMixPanelEnabled, isIdentified, userAttributes, txHistory])
}
