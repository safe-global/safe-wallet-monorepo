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
import type { SafeEventMap, AnalyticsEvent, EventContext } from '@/services/analytics/core'
import { DeviceType } from '@/services/analytics/types'

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
  isProviderEnabled: (providerId: 'ga' | 'mixpanel') => boolean
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
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  const deviceType = useMemo(() => {
    return isMobile ? DeviceType.MOBILE : isTablet ? DeviceType.TABLET : DeviceType.DESKTOP
  }, [isMobile, isTablet])

  // Build default context
  const defaultContext = useMemo((): EventContext => {
    return {
      chainId: chainId || undefined,
      safeAddress: safeAddress || undefined,
      userId: safeAddress || undefined, // Use safe address as user ID
      source: 'web' as const,
      locale: isNavigatorAvailable ? navigator.language : undefined,
      device: createDeviceInfo(),
      ...config.defaultContext,
    }
  }, [chainId, safeAddress, config.defaultContext])

  // Initialize analytics system
  useEffect(() => {
    if (!isAnalyticsEnabled) {
      analyticsRef.current = null
      return
    }

    const builder = AnalyticsBuilder.create<E>()

    // Always add Google Analytics provider
    const gaProvider = new GoogleAnalyticsProvider({
      debugMode: config.debugMode,
    })
    builder.addProvider(gaProvider)

    // Add Mixpanel provider if feature is enabled
    if (isMixpanelEnabled) {
      const mixpanelProvider = new MixpanelProvider({
        debugMode: config.debugMode,
      })
      builder.addProvider(mixpanelProvider)
    }

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
    if (!analyticsRef.current || !wallet) return

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
      analyticsRef.current.identify(userId, Object.keys(traits).length > 0 ? traits : undefined)
    }
  }, [wallet, walletChain, safeAddress])

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
    (providerId: 'ga' | 'mixpanel'): boolean => {
      if (!isAnalyticsEnabled || !analyticsRef.current) return false

      if (providerId === 'mixpanel' && !isMixpanelEnabled) return false

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
