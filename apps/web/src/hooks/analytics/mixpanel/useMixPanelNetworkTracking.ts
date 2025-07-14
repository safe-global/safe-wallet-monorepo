import { useEffect } from 'react'
import { setMixPanelUserAttributes, registerMixPanelSuperProperties } from '@/services/analytics/mixpanel-tracking'
import type { SafeUserAttributes } from '@/services/analytics/types'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'

interface UseMixPanelNetworkTrackingParams {
  isMixPanelEnabled: boolean
  isIdentified: boolean
  userAttributes: SafeUserAttributes | null
  currentChain: ChainInfo | undefined
}

/**
 * Hook to track network/chain changes
 */
export const useMixPanelNetworkTracking = ({
  isMixPanelEnabled,
  isIdentified,
  userAttributes,
  currentChain,
}: UseMixPanelNetworkTrackingParams) => {
  useEffect(() => {
    if (!isMixPanelEnabled || !isIdentified || !userAttributes || !currentChain) return

    // Update network-related attributes
    setMixPanelUserAttributes({
      ...userAttributes,
      networks: userAttributes.networks,
    })

    // Update super properties with new network
    registerMixPanelSuperProperties({
      Network: currentChain.chainName.toLowerCase(),
    })
  }, [isMixPanelEnabled, isIdentified, userAttributes, currentChain])
}
