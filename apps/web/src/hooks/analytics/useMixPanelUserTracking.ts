import { useEffect, useRef, useState } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import { useSafeUserAttributes } from '@/services/analytics/user-attributes'
import {
  setMixPanelUserAttributes,
  setMixPanelUserAttributesOnce,
  identifyMixPanelUser,
  registerMixPanelSuperProperties,
  resetMixPanel,
  useMixPanelEnabled,
  trackMixPanelEvent,
} from '@/services/analytics/mixpanel-tracking'
import { useAppSelector } from '@/store'
import { selectTxHistory } from '@/store/txHistorySlice'

/**
 * Hook to track Safe user attributes in MixPanel
 *
 * This hook:
 * 1. Collects user attributes from Safe data
 * 2. Identifies the user using Safe address
 * 3. Sets user attributes in MixPanel
 * 4. Updates attributes when Safe data changes
 * 5. Registers super properties for events
 */
export const useMixPanelUserTracking = () => {
  const isMixPanelEnabled = useMixPanelEnabled()
  const { safe, safeAddress, safeLoaded } = useSafeInfo()
  const wallet = useWallet()
  const currentChain = useCurrentChain()
  const txHistory = useAppSelector(selectTxHistory)

  // Add initialization delay to ensure MixPanel is ready
  const [isInitialized, setIsInitialized] = useState(false)

  // Track user attributes based on current Safe
  const userAttributes = useSafeUserAttributes(safe, wallet?.address)

  // Refs to track previous values and prevent unnecessary updates
  const lastSafeAddressRef = useRef<string>('')
  const lastTxCountRef = useRef<number>(0)
  const lastThresholdRef = useRef<number>(0)
  const lastSignersCountRef = useRef<number>(0)
  const identifiedRef = useRef<boolean>(false)

  // Wait for MixPanel to be properly initialized
  useEffect(() => {
    if (isMixPanelEnabled) {
      // Small delay to ensure MixPanel is fully initialized
      const timer = setTimeout(() => {
        setIsInitialized(true)
      }, 1000)

      return () => clearTimeout(timer)
    } else {
      setIsInitialized(false)
    }
  }, [isMixPanelEnabled])

  // Effect to identify user and set initial attributes
  useEffect(() => {
    if (!isInitialized || !isMixPanelEnabled || !safeLoaded || !userAttributes || !safeAddress) return

    const isNewSafe = lastSafeAddressRef.current !== safeAddress

    if (isNewSafe) {
      // Async function to handle reset and setup sequence
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
          lastTxCountRef.current = userAttributes.total_tx_count
          lastThresholdRef.current = userAttributes.threshold
          lastSignersCountRef.current = userAttributes.num_signers
        } catch (error) {
          console.error('Error setting up new Safe tracking:', error)
        }
      }

      setupNewSafe()
    }
  }, [isInitialized, isMixPanelEnabled, safeLoaded, userAttributes, safeAddress, currentChain])

  // Effect to update attributes when Safe configuration changes
  useEffect(() => {
    if (!isInitialized || !isMixPanelEnabled || !identifiedRef.current || !userAttributes) return

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
  }, [isInitialized, isMixPanelEnabled, userAttributes, currentChain])

  // Effect to update transaction-related attributes
  useEffect(() => {
    if (!isInitialized || !isMixPanelEnabled || !identifiedRef.current || !userAttributes) return

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
  }, [isInitialized, isMixPanelEnabled, userAttributes, txHistory])

  // Effect to update network-related attributes when chain changes
  useEffect(() => {
    if (!isInitialized || !isMixPanelEnabled || !identifiedRef.current || !userAttributes || !currentChain) return

    // Update network-related attributes
    setMixPanelUserAttributes({
      ...userAttributes,
      networks: userAttributes.networks,
    })

    // Update super properties with new network
    registerMixPanelSuperProperties({
      Network: currentChain.chainName.toLowerCase(),
    })
  }, [isInitialized, isMixPanelEnabled, userAttributes, currentChain])

  // Return current user attributes for use in components
  return {
    userAttributes,
    isTracking: isInitialized && isMixPanelEnabled && identifiedRef.current,
    safeAddress,
  }
}

/**
 * Hook to track transaction events with user context
 * Use this hook in transaction-related components
 */
export const useMixPanelTransactionTracking = () => {
  const { userAttributes, isTracking } = useMixPanelUserTracking()
  const currentChain = useCurrentChain()

  const getTransactionEventProperties = (additionalProps: Record<string, any> = {}) => {
    if (!userAttributes || !currentChain) return null

    return {
      'Safe Address': userAttributes.safe_id,
      'Safe Version': userAttributes.safe_version,
      Network: currentChain.chainName.toLowerCase(),
      'Number of Signers': userAttributes.num_signers,
      Threshold: userAttributes.threshold,
      'Total Transaction Count': userAttributes.total_tx_count,
      ...additionalProps,
    }
  }

  return {
    isTracking,
    getTransactionEventProperties,
    userAttributes,
  }
}

/**
 * Hook to track Safe management events (add/remove owners, change threshold, etc.)
 * Use this hook in Safe management components
 */
export const useMixPanelSafeManagementTracking = () => {
  const { userAttributes, isTracking } = useMixPanelUserTracking()
  const currentChain = useCurrentChain()

  const getSafeManagementEventProperties = (additionalProps: Record<string, any> = {}) => {
    if (!userAttributes || !currentChain) return null

    return {
      'Safe Address': userAttributes.safe_id,
      'Safe Version': userAttributes.safe_version,
      Network: currentChain.chainName.toLowerCase(),
      'Number of Signers': userAttributes.num_signers,
      Threshold: userAttributes.threshold,
      ...additionalProps,
    }
  }

  return {
    isTracking,
    getSafeManagementEventProperties,
    userAttributes,
  }
}

/**
 * Hook to track Safe Apps events with MixPanel
 * Use this hook in Safe Apps related components
 */
export const useMixPanelSafeAppsTracking = () => {
  const { userAttributes, isTracking, safeAddress } = useMixPanelUserTracking()
  const currentChain = useCurrentChain()

  const getSafeAppsEventProperties = (
    app_name: string,
    app_category?: string,
    entry_point?: string,
    additionalProps: Record<string, any> = {},
  ) => {
    // Always return event properties, use fallbacks when data is missing
    const safeId = userAttributes?.safe_id || safeAddress || 'unknown'
    const networkName = currentChain?.chainName?.toLowerCase() || 'unknown'

    return {
      'Safe Address': safeId,
      Network: networkName,
      'App Name': app_name,
      'App Category': app_category || 'unknown',
      'Entry Point': entry_point || 'unknown',
      'Safe Version': userAttributes?.safe_version || 'unknown',
      'Number of Signers': userAttributes?.num_signers || 0,
      Threshold: userAttributes?.threshold || 0,
      'Total Transaction Count': userAttributes?.total_tx_count || 0,
      ...additionalProps,
    }
  }

  const trackAppClicked = (app_name: string, app_category?: string, entry_point?: string) => {
    const eventProperties = getSafeAppsEventProperties(app_name, app_category, entry_point)
    trackMixPanelEvent('App Clicked', eventProperties)
  }

  const trackAppLaunched = (app_name: string, app_category?: string, entry_point?: string) => {
    const eventProperties = getSafeAppsEventProperties(app_name, app_category, entry_point)
    trackMixPanelEvent('Safe App Launched', eventProperties)
  }

  return {
    isTracking,
    getSafeAppsEventProperties,
    trackAppClicked,
    trackAppLaunched,
    userAttributes,
  }
}
