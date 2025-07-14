import { useEffect, useRef } from 'react'
import { setMixPanelUserAttributes, registerMixPanelSuperProperties } from '@/services/analytics/mixpanel-tracking'
import type { SafeUserAttributes } from '@/services/analytics/types'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'

interface UseMixPanelConfigurationTrackingParams {
  isMixPanelEnabled: boolean
  isIdentified: boolean
  userAttributes: SafeUserAttributes | null
  currentChain: ChainInfo | undefined
}

/**
 * Hook to track Safe configuration changes (threshold and signers)
 */
export const useMixPanelConfigurationTracking = ({
  isMixPanelEnabled,
  isIdentified,
  userAttributes,
  currentChain,
}: UseMixPanelConfigurationTrackingParams) => {
  const lastThresholdRef = useRef<number>(0)
  const lastSignersCountRef = useRef<number>(0)

  useEffect(() => {
    if (!isMixPanelEnabled || !isIdentified || !userAttributes) return

    const hasConfigurationChanged =
      lastThresholdRef.current !== userAttributes.threshold ||
      lastSignersCountRef.current !== userAttributes.num_signers

    if (hasConfigurationChanged) {
      // Update configuration-related attributes
      setMixPanelUserAttributes({
        ...userAttributes,
        threshold: userAttributes.threshold,
        num_signers: userAttributes.num_signers,
      })

      // Update super properties
      registerMixPanelSuperProperties({
        'Safe Address': userAttributes.safe_id,
        'Safe Version': userAttributes.safe_version,
        Network: currentChain?.chainName.toLowerCase() || 'unknown',
      })

      lastThresholdRef.current = userAttributes.threshold
      lastSignersCountRef.current = userAttributes.num_signers
    }
  }, [isMixPanelEnabled, isIdentified, userAttributes, currentChain])
}
