import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import { useSafeUserAttributes } from '@/services/analytics/user-attributes'
import { useMixPanelEnabled, trackMixPanelEvent } from '@/services/analytics/mixpanel-tracking'
import { useAppSelector } from '@/store'
import { selectTxHistory } from '@/store/txHistorySlice'
import {
  useMixPanelIdentity,
  useMixPanelConfigurationTracking,
  useMixPanelTransactionCountTracking,
  useMixPanelNetworkTracking,
} from '@/hooks/analytics/mixpanel'

/**
 * Hook to track Safe user attributes in MixPanel
 *
 * This hook orchestrates smaller hooks to:
 * 1. Identify users and handle Safe switching
 * 2. Track configuration changes (threshold, signers)
 * 3. Track transaction count changes
 * 4. Track network/chain changes
 */
export const useMixPanelUserTracking = () => {
  const isMixPanelEnabled = useMixPanelEnabled()
  const { safe, safeAddress, safeLoaded } = useSafeInfo()
  const wallet = useWallet()
  const currentChain = useCurrentChain()
  const txHistory = useAppSelector(selectTxHistory)

  // Track user attributes based on current Safe
  const userAttributes = useSafeUserAttributes(safe, wallet?.address)

  // Handle user identification and Safe switching
  const { isIdentified } = useMixPanelIdentity({
    isMixPanelEnabled,
    safeAddress,
    userAttributes,
    currentChain,
    safeLoaded,
  })

  // Track Safe configuration changes
  useMixPanelConfigurationTracking({
    isMixPanelEnabled,
    isIdentified,
    userAttributes,
    currentChain,
  })

  // Track transaction count changes
  useMixPanelTransactionCountTracking({
    isMixPanelEnabled,
    isIdentified,
    userAttributes,
    txHistory,
  })

  // Track network/chain changes
  useMixPanelNetworkTracking({
    isMixPanelEnabled,
    isIdentified,
    userAttributes,
    currentChain,
  })

  // Return current user attributes for use in components
  return {
    userAttributes,
    isTracking: isMixPanelEnabled && isIdentified,
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
