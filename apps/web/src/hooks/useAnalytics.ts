/**
 * React hook for analytics tracking using the new analytics abstraction layer.
 * Provides type-safe event tracking with automatic consent management and provider initialization.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTheme } from '@mui/material/styles'
import { useMediaQuery } from '@mui/material'
import { useAppSelector } from '@/store'
import { CookieAndTermType, hasConsentFor } from '@/store/cookiesAndTermsSlice'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { SAFE_APPS_GA_TRACKING_ID } from '@/config/constants'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import useWallet from '@/hooks/wallets/useWallet'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import { useChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'

import type { Analytics } from '@/services/analytics/core'
import { AnalyticsBuilder } from '@/services/analytics/core'
import { GoogleAnalyticsProvider } from '@/services/analytics/providers/GoogleAnalyticsProvider'
import { MixpanelProvider } from '@/services/analytics/providers/MixpanelProvider'
import { GoogleAnalyticsConsentHandler } from '@/services/analytics/providers/GoogleAnalyticsConsentHandler'
import { MixpanelConsentHandler } from '@/services/analytics/providers/MixpanelConsentHandler'
import { PROVIDER, type ProviderId } from '@/services/analytics/providers/constants'
import type { SafeEventMap, AnalyticsEvent, EventContext } from '@/services/analytics/core'
import { DeviceType } from '@/services/analytics/types'
import useMetaEvents from './analytics/useMetaEvents'

// Browser environment detection
const isBrowserEnvironment = typeof window !== 'undefined'
const isNavigatorAvailable = typeof navigator !== 'undefined'
const isDocumentAvailable = typeof document !== 'undefined'

/**
 * Creates device information object for analytics context
 */
const createDeviceInfo = () => {
  if (!isNavigatorAvailable || !isBrowserEnvironment) {
    return {
      userAgent: undefined,
      screen: undefined,
    }
  }

  return {
    userAgent: navigator.userAgent,
    screen: {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
    },
  }
}

/**
 * Determines device type based on Material-UI breakpoints
 */
const useDeviceType = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

  return useMemo(() => {
    return isMobile ? DeviceType.MOBILE : isTablet ? DeviceType.TABLET : DeviceType.DESKTOP
  }, [isMobile, isTablet])
}

/**
 * Creates and configures analytics providers based on feature flags
 */
const createAnalyticsProviders = <E extends SafeEventMap>(
  isMixpanelEnabled: boolean,
  debugMode = false,
): AnalyticsBuilder<E> => {
  const builder = AnalyticsBuilder.create<E>()

  // Add main Google Analytics provider
  const gaProvider = new GoogleAnalyticsProvider({
    debugMode,
    providerId: PROVIDER.GA,
  })
  builder.addProvider(gaProvider)

  // Add Safe Apps Google Analytics provider for ecosystem tracking
  const gaSafeAppsProvider = new GoogleAnalyticsProvider({
    measurementId: SAFE_APPS_GA_TRACKING_ID,
    debugMode,
    providerId: PROVIDER.GA_SAFE_APPS,
  })
  builder.addProvider(gaSafeAppsProvider)

  // Add Mixpanel provider if feature is enabled
  if (isMixpanelEnabled) {
    const mixpanelProvider = new MixpanelProvider({
      debugMode,
    })
    builder.addProvider(mixpanelProvider)
  }

  return builder
}

/**
 * Handles provider-specific consent changes
 */
const handleConsentChanges = (
  analytics: Analytics<any> | null,
  isAnalyticsEnabled: boolean,
  isMixpanelEnabled: boolean,
) => {
  if (!analytics) return

  const consentManager = analytics.getConsentManager()
  if (!consentManager) return

  // Update core consent state (provider-agnostic)
  if (isAnalyticsEnabled) {
    consentManager.enableAnalytics()
  } else {
    consentManager.disableAnalytics()
  }

  // Handle provider-specific consent logic
  const consentState = consentManager.get()

  // Google Analytics consent handling (GA consent API + cookies + page reload)
  GoogleAnalyticsConsentHandler.handleConsentChange(consentState)

  // Mixpanel consent handling (opt-in/opt-out tracking)
  if (isMixpanelEnabled) {
    MixpanelConsentHandler.handleConsentChange(consentState)
  }
}

/**
 * Creates the default analytics context from hook data
 */
const createDefaultContext = (
  chainId: string | undefined,
  safeAddress: string | undefined,
  configContext?: Partial<EventContext>,
): EventContext => {
  return {
    chainId: chainId || undefined,
    safeAddress: safeAddress || undefined,
    userId: safeAddress || undefined,
    source: 'web' as const,
    locale: isNavigatorAvailable ? navigator.language : undefined,
    device: createDeviceInfo(),
    ...configContext,
  }
}

/**
 * Identifies user with wallet traits when wallet changes
 */
const identifyUserWithWallet = (
  analytics: Analytics<any> | null,
  wallet: any,
  walletChain: any,
  safeAddress: string | undefined,
) => {
  if (!analytics || !wallet) return

  const traits: Record<string, unknown> = {}

  if (wallet.label) {
    traits.walletLabel = wallet.label
  }
  if (wallet.address) {
    traits.walletAddress = wallet.address
  }
  if (walletChain) {
    traits.walletNetwork = walletChain.chainName
  }

  // Use safe address as primary user ID, fallback to wallet address
  const userId = safeAddress || wallet.address
  if (userId) {
    analytics.identify(userId, Object.keys(traits).length > 0 ? traits : undefined)
  }
}

/**
 * Analytics hook configuration
 */
export interface UseAnalyticsConfig {
  /** Override default context values */
  defaultContext?: Partial<EventContext>
  /** Enable debug mode for analytics logging */
  debugMode?: boolean
}

/**
 * Analytics hook return type
 */
export interface UseAnalyticsResult<E extends SafeEventMap = SafeEventMap> {
  /** Track an analytics event */
  track: <K extends Extract<keyof E, string>>(event: AnalyticsEvent<K, E[K]>) => void
  /** Identify a user with optional traits */
  identify: (userId: string, traits?: Record<string, unknown>) => void
  /** Track a page view */
  page: (path?: string, title?: string) => void
  /** Check if analytics is enabled and has consent */
  isEnabled: boolean
  /** Check if specific provider is enabled */
  isProviderEnabled: (providerId: ProviderId) => boolean
}

/**
 * React hook for analytics tracking with the new abstraction layer
 */
export const useAnalytics = <E extends SafeEventMap = SafeEventMap>(
  config: UseAnalyticsConfig = {},
): UseAnalyticsResult<E> => {
  const analyticsRef = useRef<Analytics<any> | null>(null)

  // Consent and feature flags
  const isAnalyticsEnabled = useAppSelector((state) => hasConsentFor(state, CookieAndTermType.ANALYTICS))
  const isMixpanelEnabled = useHasFeature(FEATURES.MIXPANEL)

  // Context data
  const chainId = useChainId()
  const safeAddress = useSafeAddress()
  const wallet = useWallet()
  const isSpaceRoute = useIsSpaceRoute()
  const { safe } = useSafeInfo()
  useChain(safe?.chainId || '')
  const walletChain = useChain(wallet?.chainId || '')

  // Device detection
  const deviceType = useDeviceType()

  // Build default context
  const defaultContext = useMemo(
    () => createDefaultContext(chainId, safeAddress, config.defaultContext),
    [chainId, safeAddress, config.defaultContext],
  )

  // Initialize analytics system
  useEffect(() => {
    if (!isAnalyticsEnabled) {
      analyticsRef.current = null
      return
    }

    const builder = createAnalyticsProviders<E>(isMixpanelEnabled ?? false, config.debugMode ?? false)

    // Build analytics instance with proper consent mapping
    const analytics = builder
      .withDefaultContext(defaultContext)
      .withConsent({
        analytics: isAnalyticsEnabled,
        necessary: true, // Always true for necessary cookies
        updatedAt: Date.now(),
      })
      .build()

    // Initialize
    analytics.init().catch(console.error)

    analyticsRef.current = analytics

    return () => {
      // Cleanup
      analytics.shutdown().catch(console.error)
      analyticsRef.current = null
    }
  }, [isAnalyticsEnabled, isMixpanelEnabled, config.debugMode, defaultContext])

  // Handle provider-specific consent changes
  useEffect(() => {
    handleConsentChanges(analyticsRef.current, isAnalyticsEnabled, isMixpanelEnabled ?? false)
  }, [isAnalyticsEnabled, isMixpanelEnabled])

  // Update context when relevant values change
  useEffect(() => {
    if (!analyticsRef.current) return

    const contextUpdate = {
      chainId: chainId || undefined,
      safeAddress: safeAddress || undefined,
    }

    // Update the analytics default context
    analyticsRef.current.setDefaultContext(contextUpdate)
  }, [chainId, safeAddress, deviceType])

  // Identify user when wallet changes
  useEffect(() => {
    identifyUserWithWallet(analyticsRef.current, wallet, walletChain, safeAddress)
  }, [wallet, walletChain, safeAddress])

  // Track meta events on app load (pass analytics instance to avoid circular dependency)
  // Only enable meta events when analytics is fully initialized and enabled
  useMetaEvents(isAnalyticsEnabled ? analyticsRef.current : null)

  // Analytics methods
  const track = useCallback(
    <K extends Extract<keyof E, string>>(event: AnalyticsEvent<K, E[K]>) => {
      if (!analyticsRef.current || !isAnalyticsEnabled) return

      analyticsRef.current.track(event)
    },
    [isAnalyticsEnabled],
  )

  const identify = useCallback(
    (userId: string, traits?: Record<string, unknown>) => {
      if (!analyticsRef.current || !isAnalyticsEnabled) return

      analyticsRef.current.identify(userId, traits)
    },
    [isAnalyticsEnabled],
  )

  const page = useCallback(
    (path?: string, title?: string) => {
      if (!analyticsRef.current || !isAnalyticsEnabled || isSpaceRoute) return

      analyticsRef.current.page({
        path: path || (isBrowserEnvironment ? window.location.pathname : undefined),
        title: title || (isDocumentAvailable ? document.title : undefined),
        url: isBrowserEnvironment ? window.location.href : undefined,
      })
    },
    [isAnalyticsEnabled, isSpaceRoute],
  )

  const isProviderEnabled = useCallback(
    (providerId: ProviderId): boolean => {
      if (!isAnalyticsEnabled || !analyticsRef.current) return false

      if (providerId === PROVIDER.Mixpanel && !isMixpanelEnabled) return false

      return analyticsRef.current.getProviders().includes(providerId)
    },
    [isAnalyticsEnabled, isMixpanelEnabled],
  )

  return {
    track,
    identify,
    page,
    isEnabled: isAnalyticsEnabled,
    isProviderEnabled,
  }
}

/**
 * Default analytics hook instance
 */
export default useAnalytics
