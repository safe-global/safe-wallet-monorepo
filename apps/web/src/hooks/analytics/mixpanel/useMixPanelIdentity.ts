import { useEffect, useRef } from 'react'
import {
  identifyMixPanelUser,
  resetMixPanel,
  setMixPanelUserAttributesOnce,
  setMixPanelUserAttributes,
  registerMixPanelSuperProperties,
} from '@/services/analytics/mixpanel-tracking'
import type { SafeUserAttributes } from '@/services/analytics/types'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'

interface UseMixPanelIdentityParams {
  isMixPanelEnabled: boolean
  safeAddress: string | undefined
  userAttributes: SafeUserAttributes | null
  currentChain: ChainInfo | undefined
  safeLoaded: boolean
}

/**
 * Hook to handle MixPanel user identification and initial setup
 * Handles switching between different Safes and resetting data
 */
export const useMixPanelIdentity = ({
  isMixPanelEnabled,
  safeAddress,
  userAttributes,
  currentChain,
  safeLoaded,
}: UseMixPanelIdentityParams) => {
  const lastSafeAddressRef = useRef<string>('')
  const identifiedRef = useRef<boolean>(false)

  useEffect(() => {
    if (!isMixPanelEnabled || !safeLoaded || !userAttributes || !safeAddress) return

    const isNewSafe = lastSafeAddressRef.current !== safeAddress

    if (isNewSafe) {
      const setupNewSafe = async () => {
        try {
          // Reset MixPanel to clear previous user data when switching Safes
          await resetMixPanel()

          // Identify user with Safe address for cohort analysis
          identifyMixPanelUser(safeAddress)
          identifiedRef.current = true

          // Set attributes that should only be set once
          setMixPanelUserAttributesOnce({
            safe_id: userAttributes.safe_id,
            created_at: userAttributes.created_at,
          })

          // Set all current attributes
          setMixPanelUserAttributes(userAttributes)

          // Register super properties for events
          registerMixPanelSuperProperties({
            'Safe Address': userAttributes.safe_id,
            'Safe Version': userAttributes.safe_version,
            Network: currentChain?.chainName.toLowerCase() || 'unknown',
          })

          lastSafeAddressRef.current = safeAddress
        } catch (error) {
          console.error('Error setting up new Safe tracking:', error)
        }
      }

      setupNewSafe()
    }
  }, [isMixPanelEnabled, safeLoaded, userAttributes, safeAddress, currentChain])

  return { isIdentified: identifiedRef.current }
}
