/**
 * Unit tests for useAnalytics hook
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useAnalytics } from '../useAnalytics'
import type { SafeEventMap, AnalyticsEvent } from '@/services/analytics/core/types'
import type { TrackOptions } from '@/services/analytics/providers/constants'

// Mock dependencies
jest.mock('@mui/material/styles', () => ({
  useTheme: () => ({
    breakpoints: {
      down: (size: string) => `(max-width:${size === 'sm' ? '600' : '960'}px)`,
    },
  }),
}))

jest.mock('@mui/material', () => ({
  useMediaQuery: jest.fn(),
}))

jest.mock('@/store', () => ({
  useAppSelector: jest.fn(),
}))

jest.mock('@/store/cookiesAndTermsSlice', () => ({
  hasConsentFor: jest.fn(),
  CookieAndTermType: {
    TERMS: 'terms',
    NECESSARY: 'necessary',
    UPDATES: 'updates',
    ANALYTICS: 'analytics',
  },
}))

jest.mock('@/hooks/useChains', () => ({
  useHasFeature: jest.fn(),
  useChain: jest.fn(),
}))

jest.mock('@safe-global/utils/utils/chains', () => ({
  FEATURES: {
    MIXPANEL: 'mixpanel',
  },
}))

jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('@/hooks/useSafeAddress', () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('@/hooks/useIsSpaceRoute', () => ({
  useIsSpaceRoute: jest.fn(),
}))

jest.mock('../analytics/useMetaEvents', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/services/analytics/providers/GoogleAnalyticsConsentHandler', () => ({
  GoogleAnalyticsConsentHandler: {
    handleConsentChange: jest.fn(),
    enableAnalytics: jest.fn(),
    disableAnalytics: jest.fn(),
  },
}))

jest.mock('@/services/analytics/providers/MixpanelConsentHandler', () => ({
  MixpanelConsentHandler: {
    handleConsentChange: jest.fn(),
    enableAnalytics: jest.fn(),
    disableAnalytics: jest.fn(),
  },
}))
jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/services/analytics/core', () => ({
  AnalyticsBuilder: {
    create: jest.fn(),
  },
}))

jest.mock('@/services/analytics/providers/GoogleAnalyticsProvider', () => ({
  GoogleAnalyticsProvider: jest.fn(),
}))

jest.mock('@/services/analytics/providers/MixpanelProvider', () => ({
  MixpanelProvider: jest.fn(),
}))

import { useMediaQuery } from '@mui/material'
import { useAppSelector } from '@/store'
import { hasConsentFor } from '@/store/cookiesAndTermsSlice'
import { useHasFeature, useChain } from '@/hooks/useChains'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import useWallet from '@/hooks/wallets/useWallet'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import useSafeInfo from '@/hooks/useSafeInfo'
import { AnalyticsBuilder } from '@/services/analytics/core'
import { GoogleAnalyticsProvider } from '@/services/analytics/providers/GoogleAnalyticsProvider'
import { MixpanelProvider } from '@/services/analytics/providers/MixpanelProvider'

// Mock implementations
const mockUseMediaQuery = useMediaQuery as jest.MockedFunction<typeof useMediaQuery>
const mockUseAppSelector = useAppSelector as jest.MockedFunction<typeof useAppSelector>
const mockHasConsentFor = hasConsentFor as jest.MockedFunction<typeof hasConsentFor>
const mockUseHasFeature = useHasFeature as jest.MockedFunction<typeof useHasFeature>
const mockUseChainId = useChainId as jest.MockedFunction<typeof useChainId>
const mockUseSafeAddress = useSafeAddress as jest.MockedFunction<typeof useSafeAddress>
const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>
const mockUseIsSpaceRoute = useIsSpaceRoute as jest.MockedFunction<typeof useIsSpaceRoute>
const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const mockUseChain = useChain as jest.MockedFunction<typeof useChain>

const mockAnalyticsBuilder = AnalyticsBuilder.create as jest.MockedFunction<typeof AnalyticsBuilder.create>
const mockGoogleAnalyticsProvider = GoogleAnalyticsProvider as jest.MockedClass<typeof GoogleAnalyticsProvider>
const mockMixpanelProvider = MixpanelProvider as jest.MockedClass<typeof MixpanelProvider>

// Mock consent manager
const mockConsentManager = {
  get: jest.fn().mockReturnValue({ analytics: true, necessary: true, updatedAt: Date.now() }),
  enableAnalytics: jest.fn(),
  disableAnalytics: jest.fn(),
}

// Mock analytics instance
const mockAnalyticsInstance = {
  providers: [],
  init: jest.fn().mockResolvedValue(undefined),
  shutdown: jest.fn().mockResolvedValue(undefined),
  track: jest.fn() as jest.MockedFunction<(event: any, options?: any) => void>,
  identify: jest.fn(),
  page: jest.fn(),
  setDefaultContext: jest.fn(),
  getProviders: jest.fn().mockReturnValue(['ga', 'ga_safe_apps', 'mixpanel']),
  getConsentManager: jest.fn().mockReturnValue(mockConsentManager),
}

const mockBuilder = {
  providers: [],
  middlewares: [],
  debugMode: false,
  addProvider: jest.fn().mockReturnThis(),
  addProviders: jest.fn().mockReturnThis(),
  withDefaultContext: jest.fn().mockReturnThis(),
  withConsent: jest.fn().mockReturnThis(),
  withRouter: jest.fn().mockReturnThis(),
  withErrorHandler: jest.fn().mockReturnThis(),
  withDebug: jest.fn().mockReturnThis(),
  withDebugMode: jest.fn().mockReturnThis(),
  use: jest.fn().mockReturnThis(),
  addMiddleware: jest.fn().mockReturnThis(),
  addMiddlewares: jest.fn().mockReturnThis(),
  build: jest.fn().mockReturnValue(mockAnalyticsInstance),
}

// Test event types
type TestEvents = SafeEventMap & {
  'Test Event': { testProperty: string; value: number }
  'Safe App Launched': { appName: string; version: string }
}

describe('useAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    mockUseMediaQuery.mockReturnValue(false) // Desktop by default
    mockUseAppSelector.mockImplementation((selector) =>
      selector({
        cookies_terms: { analytics: true, termsVersion: 'v1' },
        txQueue: { data: { results: [] } }, // Mock empty transaction queue for meta events
      } as any),
    )
    mockHasConsentFor.mockReturnValue(true)
    mockUseHasFeature.mockReturnValue(true)
    mockUseChainId.mockReturnValue('1')
    mockUseSafeAddress.mockReturnValue('0x123...abc')
    mockUseWallet.mockReturnValue({
      label: 'MetaMask',
      address: '0x456...def',
      chainId: '1',
      provider: {} as any,
    })
    mockUseIsSpaceRoute.mockReturnValue(false)
    mockUseSafeInfo.mockReturnValue({
      safe: { chainId: '1', address: { value: '0x123...abc' } },
      safeAddress: '0x123...abc',
    } as any)
    mockUseChain.mockReturnValue({
      chainId: '1',
      chainName: 'Ethereum',
    } as any)

    mockAnalyticsBuilder.mockReturnValue(mockBuilder as any)
    mockGoogleAnalyticsProvider.mockImplementation(
      (config: any) =>
        ({
          id: config?.providerId || 'ga', // Use provided ID or default to 'ga'
        }) as any,
    )
    mockMixpanelProvider.mockImplementation(() => ({ id: 'mixpanel' }) as any)
    mockAnalyticsInstance.providers = [{ id: 'ga' }, { id: 'ga_safe_apps' }, { id: 'mixpanel' }] as any
  })

  describe('Initialization', () => {
    it('should initialize analytics when consent is given', async () => {
      renderHook(() => useAnalytics())

      await waitFor(() => {
        expect(mockAnalyticsBuilder).toHaveBeenCalled()
        expect(mockBuilder.addProvider).toHaveBeenCalledWith(expect.objectContaining({ id: 'ga' }))
        expect(mockBuilder.addProvider).toHaveBeenCalledWith(expect.objectContaining({ id: 'ga_safe_apps' }))
        expect(mockBuilder.addProvider).toHaveBeenCalledWith(expect.objectContaining({ id: 'mixpanel' }))
        expect(mockBuilder.withDefaultContext).toHaveBeenCalled()
        expect(mockBuilder.withConsent).toHaveBeenCalled()
        expect(mockBuilder.build).toHaveBeenCalled()
        expect(mockAnalyticsInstance.init).toHaveBeenCalled()
      })
    })

    it('should not initialize analytics when consent is not given', () => {
      mockHasConsentFor.mockReturnValue(false)

      renderHook(() => useAnalytics())

      expect(mockAnalyticsBuilder).not.toHaveBeenCalled()
    })

    it('should only add GA provider when Mixpanel is disabled', async () => {
      mockUseHasFeature.mockReturnValue(false) // Disable Mixpanel

      renderHook(() => useAnalytics())

      await waitFor(() => {
        expect(mockBuilder.addProvider).toHaveBeenCalledTimes(2) // Main GA + Safe Apps GA
        expect(mockBuilder.addProvider).toHaveBeenCalledWith(expect.objectContaining({ id: 'ga' }))
        expect(mockBuilder.addProvider).toHaveBeenCalledWith(expect.objectContaining({ id: 'ga_safe_apps' }))
      })
    })

    it('should pass debug mode to providers', async () => {
      renderHook(() => useAnalytics({ debugMode: true }))

      await waitFor(() => {
        expect(mockGoogleAnalyticsProvider).toHaveBeenCalledWith(expect.objectContaining({ debugMode: true }))
        expect(mockMixpanelProvider).toHaveBeenCalledWith({ debugMode: true })
      })
    })

    it('should build default context with current values', async () => {
      renderHook(() => useAnalytics())

      await waitFor(() => {
        expect(mockBuilder.withDefaultContext).toHaveBeenCalledWith({
          chainId: '1',
          safeAddress: '0x123...abc',
          userId: '0x123...abc',
          source: 'web',
          locale: 'en-US',
          device: {
            userAgent: expect.any(String),
            screen: expect.objectContaining({
              width: expect.any(Number),
              height: expect.any(Number),
              pixelRatio: expect.any(Number),
            }),
          },
        })
      })
    })

    it('should merge custom default context', async () => {
      const customContext = { test: true }

      renderHook(() => useAnalytics({ defaultContext: customContext }))

      await waitFor(() => {
        expect(mockBuilder.withDefaultContext).toHaveBeenCalledWith({
          chainId: '1',
          safeAddress: '0x123...abc',
          userId: '0x123...abc',
          source: 'web',
          locale: 'en-US',
          device: {
            userAgent: expect.any(String),
            screen: expect.objectContaining({
              width: expect.any(Number),
              height: expect.any(Number),
              pixelRatio: expect.any(Number),
            }),
          },
          test: true,
        })
      })
    })
  })

  describe('Device Detection', () => {
    it('should detect mobile device', async () => {
      mockUseMediaQuery.mockImplementation((query) => typeof query === 'string' && query.includes('600px'))

      const { result } = renderHook(() => useAnalytics())

      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true)
      })

      // Check that context update would be called with mobile device type
      expect(mockUseMediaQuery).toHaveBeenCalledWith('(max-width:600px)')
    })

    it('should detect tablet device', async () => {
      mockUseMediaQuery.mockImplementation(
        (query) => typeof query === 'string' && query.includes('960px') && !query.includes('600px'),
      )

      renderHook(() => useAnalytics())

      expect(mockUseMediaQuery).toHaveBeenCalledWith('(max-width:600px)')
      expect(mockUseMediaQuery).toHaveBeenCalledWith('(max-width:960px)')
    })
  })

  describe('Event Tracking', () => {
    it('should track events when enabled', async () => {
      const { result } = renderHook(() => useAnalytics<TestEvents>())

      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true)
      })

      const testEvent: AnalyticsEvent<'Test Event', TestEvents['Test Event']> = {
        name: 'Test Event',
        payload: { testProperty: 'test', value: 123 },
      }

      result.current.track(testEvent)

      expect(mockAnalyticsInstance.track).toHaveBeenCalledWith(testEvent, undefined)
    })

    it('should pass TrackOptions to analytics instance when provided', async () => {
      mockHasConsentFor.mockReturnValue(true)

      const { result } = renderHook(() => useAnalytics<TestEvents>())

      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true)
      })

      const testEvent: AnalyticsEvent<'Test Event', TestEvents['Test Event']> = {
        name: 'Test Event',
        payload: { testProperty: 'test', value: 123 },
      }

      const trackOptions: TrackOptions = { excludeProviders: ['mixpanel' as const] }
      ;(result.current.track as any)(testEvent, trackOptions)

      expect(mockAnalyticsInstance.track).toHaveBeenCalledWith(testEvent, trackOptions)
    })

    it('should not track events when disabled', async () => {
      mockHasConsentFor.mockReturnValue(false)

      const { result } = renderHook(() => useAnalytics<TestEvents>())

      const testEvent: AnalyticsEvent<'Test Event', TestEvents['Test Event']> = {
        name: 'Test Event',
        payload: { testProperty: 'test', value: 123 },
      }

      result.current.track(testEvent)

      expect(mockAnalyticsInstance.track).not.toHaveBeenCalled()
    })
  })

  describe('User Identification', () => {
    it('should identify user with traits', async () => {
      const { result } = renderHook(() => useAnalytics())

      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true)
      })

      result.current.identify('user-123', { plan: 'premium' })

      expect(mockAnalyticsInstance.identify).toHaveBeenCalledWith('user-123', { plan: 'premium' })
    })

    it('should identify user without traits', async () => {
      const { result } = renderHook(() => useAnalytics())

      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true)
      })

      result.current.identify('user-456')

      expect(mockAnalyticsInstance.identify).toHaveBeenCalledWith('user-456', undefined)
    })

    it('should not identify user when disabled', async () => {
      mockHasConsentFor.mockReturnValue(false)

      const { result } = renderHook(() => useAnalytics())

      result.current.identify('user-789')

      expect(mockAnalyticsInstance.identify).not.toHaveBeenCalled()
    })
  })

  describe('Page Tracking', () => {
    it('should track page views', async () => {
      const { result } = renderHook(() => useAnalytics())

      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true)
      })

      result.current.page('/dashboard', 'Dashboard')

      expect(mockAnalyticsInstance.page).toHaveBeenCalledWith({
        path: '/dashboard',
        title: 'Dashboard',
        url: expect.stringContaining('http://localhost'),
      })
    })

    it('should not track page views in space routes', async () => {
      mockUseIsSpaceRoute.mockReturnValue(true)

      const { result } = renderHook(() => useAnalytics())

      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true)
      })

      result.current.page('/space/123')

      expect(mockAnalyticsInstance.page).not.toHaveBeenCalled()
    })

    it('should not track page views when disabled', async () => {
      mockHasConsentFor.mockReturnValue(false)

      const { result } = renderHook(() => useAnalytics())

      result.current.page('/dashboard')

      expect(mockAnalyticsInstance.page).not.toHaveBeenCalled()
    })
  })

  describe('Provider Status', () => {
    it('should check if GA provider is enabled', async () => {
      const { result } = renderHook(() => useAnalytics())

      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true)
      })

      expect(result.current.isProviderEnabled('ga')).toBe(true)
    })

    it('should check if Mixpanel provider is enabled', async () => {
      const { result } = renderHook(() => useAnalytics())

      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true)
      })

      expect(result.current.isProviderEnabled('mixpanel')).toBe(true)
    })

    it('should return false for Mixpanel when feature is disabled', async () => {
      mockUseHasFeature.mockReturnValue(false)
      mockAnalyticsInstance.providers = [{ id: 'ga' }] as any

      const { result } = renderHook(() => useAnalytics())

      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true)
      })

      expect(result.current.isProviderEnabled('mixpanel')).toBe(false)
    })

    it('should return false for all providers when analytics is disabled', () => {
      mockHasConsentFor.mockReturnValue(false)

      const { result } = renderHook(() => useAnalytics())

      expect(result.current.isProviderEnabled('ga')).toBe(false)
      expect(result.current.isProviderEnabled('mixpanel')).toBe(false)
    })
  })

  describe('Context Updates', () => {
    it('should update context when chain changes', async () => {
      const mockSetDefaultContext = jest.fn()
      mockAnalyticsInstance.setDefaultContext = mockSetDefaultContext

      const { rerender } = renderHook(() => useAnalytics())

      await waitFor(() => {
        expect(mockAnalyticsInstance.init).toHaveBeenCalled()
      })

      // Change chain ID
      mockUseChainId.mockReturnValue('137')
      rerender()

      await waitFor(() => {
        expect(mockSetDefaultContext).toHaveBeenCalledWith({
          chainId: '137',
          safeAddress: '0x123...abc',
        })
      })
    })

    it('should identify user when wallet changes', async () => {
      const { rerender } = renderHook(() => useAnalytics())

      await waitFor(() => {
        expect(mockAnalyticsInstance.init).toHaveBeenCalled()
      })

      // Change wallet
      mockUseWallet.mockReturnValue({
        label: 'WalletConnect',
        address: '0x789...ghi',
        chainId: '1',
        provider: {} as any,
      })
      rerender()

      await waitFor(() => {
        expect(mockAnalyticsInstance.identify).toHaveBeenCalledWith('0x123...abc', {
          walletLabel: 'WalletConnect',
          walletAddress: '0x789...ghi',
          walletNetwork: 'Ethereum',
        })
      })
    })
  })

  describe('Cleanup', () => {
    it('should cleanup analytics on unmount', async () => {
      const { unmount } = renderHook(() => useAnalytics())

      await waitFor(() => {
        expect(mockAnalyticsInstance.init).toHaveBeenCalled()
      })

      unmount()

      await waitFor(() => {
        expect(mockAnalyticsInstance.shutdown).toHaveBeenCalled()
      })
    })
  })
})
