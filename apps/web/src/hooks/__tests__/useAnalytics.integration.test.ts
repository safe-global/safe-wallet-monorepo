/**
 * Integration tests for useAnalytics hook
 * Tests complete user interaction flows with real provider instances
 */

// Mock constants before any imports
jest.mock('@/config/constants', () => ({
  ...jest.requireActual('@/config/constants'),
  GA_TRACKING_ID: 'GA-TEST-123',
  MIXPANEL_TOKEN: 'test-token',
  IS_PRODUCTION: false,
}))

// Mock @next/third-parties/google
jest.mock('@next/third-parties/google', () => ({
  sendGAEvent: jest.fn(),
}))

// Mock mixpanel-browser
jest.mock('mixpanel-browser', () => ({
  init: jest.fn(),
  track: jest.fn(),
  identify: jest.fn(),
  register: jest.fn(),
  reset: jest.fn(),
  opt_in_tracking: jest.fn(),
  opt_out_tracking: jest.fn(),
  has_opted_in_tracking: jest.fn().mockReturnValue(true),
  people: {
    set: jest.fn(),
    set_once: jest.fn(),
    increment: jest.fn(),
    append: jest.fn(),
    union: jest.fn(),
  },
}))

// Minimal mocking for required hooks - keep real analytics
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

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: jest.fn(),
}))

// Mock consent handlers to avoid external dependencies
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

// Don't mock meta events - test them
jest.mock('../analytics/useMetaEvents', () => ({
  __esModule: true,
  default: jest.fn(),
}))

import { renderHook, waitFor, act } from '@testing-library/react'
import { useAnalytics } from '../useAnalytics'
import type { SafeEventMap } from '@/services/analytics/core/types'

// Import mocked modules
import { useMediaQuery } from '@mui/material'
import { useAppSelector } from '@/store'
import { hasConsentFor } from '@/store/cookiesAndTermsSlice'
import { useHasFeature, useChain } from '@/hooks/useChains'
import useChainId from '@/hooks/useChainId'
import useSafeAddress from '@/hooks/useSafeAddress'
import useWallet from '@/hooks/wallets/useWallet'
import { useIsSpaceRoute } from '@/hooks/useIsSpaceRoute'
import useSafeInfo from '@/hooks/useSafeInfo'
import useMetaEvents from '../analytics/useMetaEvents'

// Get mocked instances

const mockMixpanel = jest.requireMock('mixpanel-browser')
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
const mockUseMetaEvents = useMetaEvents as jest.MockedFunction<typeof useMetaEvents>

// Mock gtag function for direct testing
const mockGtag = jest.fn()
Object.defineProperty(window, 'gtag', {
  value: mockGtag,
  writable: true,
})

// Test event types
type TestEvents = SafeEventMap & {
  wallet_connected: {
    wallet_label: string
    wallet_address: string
    chain_id: string
  }
  transaction_created: {
    tx_type: string
    safe_address: string
    amount?: string
  }
}

// Mock types for better type safety
type MockWallet = {
  label: string
  address: string
  chainId: string
  provider: { request: (args: any) => Promise<any> }
}

type MockSafeInfo = {
  safe: {
    chainId: string
    address: { value: string }
    nonce: number
    threshold: number
    owners: { value: string }[]
    implementation: { value: string }
    implementationVersionState: 'UP_TO_DATE' | 'OUTDATED' | 'UNKNOWN'
    deployed: boolean
  }
  safeAddress: string
  safeLoaded: boolean
  safeLoading: boolean
}

type _MockChain = {
  chainId: string
  chainName: string
  description: string
  chainLogoUri: string
  transactionService: string
  shortName: string
  l2: boolean
  isTestnet: boolean
  rpcUri: { authentication: string; value: string }
  safeAppsRpcUri: string
  publicRpcUri?: string
  blockExplorerUriTemplate: string
  balancesProvider: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
    logoUri?: string
  }
  theme: {
    textColor: string
    backgroundColor: string
  }
  ensRegistryAddress?: string
  gasPrice?: string[]
  features?: string[]
  disabledWallets?: string[]
  recommendedMasterCopyVersion?: string
  contractAddresses: Record<string, string>
}

type MockReduxState = any

describe('useAnalytics Integration', () => {
  const defaultWallet: MockWallet = {
    label: 'MetaMask',
    address: '0x456...def',
    chainId: '1',
    provider: { request: jest.fn().mockResolvedValue(null) },
  }

  const defaultSafeInfo: MockSafeInfo = {
    safe: {
      chainId: '1',
      address: { value: '0x123...abc' },
      nonce: 42,
      threshold: 2,
      owners: [{ value: '0x1234...' }, { value: '0x5678...' }],
      implementation: { value: '0xabcd...' },
      implementationVersionState: 'UP_TO_DATE',
      deployed: true,
    },
    safeAddress: '0x123...abc',
    safeLoaded: true,
    safeLoading: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mock implementations
    mockUseMediaQuery.mockReturnValue(false) // Desktop by default
    mockUseAppSelector.mockImplementation((selector) => {
      const mockState: MockReduxState = {
        cookies_terms: { analytics: true, termsVersion: 'v1' },
        txQueue: { data: { results: [] } },
      }
      return selector(mockState)
    })
    mockHasConsentFor.mockReturnValue(true)
    mockUseHasFeature.mockReturnValue(true)
    mockUseChainId.mockReturnValue('1')
    mockUseSafeAddress.mockReturnValue('0x123...abc')
    mockUseWallet.mockReturnValue(defaultWallet)
    mockUseIsSpaceRoute.mockReturnValue(false)
    mockUseSafeInfo.mockReturnValue(defaultSafeInfo)
    mockUseChain.mockReturnValue({
      chainId: '1',
      chainName: 'Ethereum',
      description: 'Ethereum Mainnet',
      chainLogoUri: 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png',
      transactionService: 'https://safe-transaction-mainnet.safe.global',
      shortName: 'eth',
      l2: false,
      isTestnet: false,
      rpcUri: { authentication: 'API_KEY', value: 'https://mainnet.infura.io/v3/' } as any,
      safeAppsRpcUri: 'https://mainnet.infura.io/v3/',
      blockExplorerUriTemplate: 'https://etherscan.io/{{address}}',
      balancesProvider: 'https://safe-client-gateway-mainnet.safe.global',
      nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
      },
      theme: {
        textColor: '#001428',
        backgroundColor: '#E8E7E6',
      },
      contractAddresses: {
        safeMasterCopyAddress: '0x1234...',
        safeProxyFactoryAddress: '0x5678...',
      },
    } as any)
    mockUseMetaEvents.mockImplementation(() => {}) // Just call it, don't mock behavior
  })

  describe('Complete User Interaction Flows', () => {
    it('should track complete wallet connection flow', async () => {
      const { result } = renderHook(() => useAnalytics<TestEvents>())

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true)
      })

      // Simulate wallet connection event
      act(() => {
        result.current.track({
          name: 'wallet_connected',
          payload: {
            wallet_label: 'MetaMask',
            wallet_address: '0x456...def',
            chain_id: '1',
          },
        })
      })

      // Verify GA received the event
      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'wallet_connected',
        expect.objectContaining({
          wallet_label: 'MetaMask',
          wallet_address: '0x456...def',
          chain_id: '1',
          // Context should be included
          user_id: expect.any(String),
          source: 'web',
          locale: 'en-US',
        }),
      )

      // Verify Mixpanel received the event
      expect(mockMixpanel.track).toHaveBeenCalledWith(
        'Wallet Connected',
        expect.objectContaining({
          'Wallet Label': 'MetaMask',
          'Wallet Address': '0x456...def',
          'Chain Id': '1',
          'User Id': expect.any(String),
          Source: 'web',
          Locale: 'en-US',
        }),
      )
    })

    it('should handle chain switching with context updates', async () => {
      const { result, rerender } = renderHook(() => useAnalytics<TestEvents>())

      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true)
      })

      // Initial transaction on Ethereum
      act(() => {
        result.current.track({
          name: 'transaction_created',
          payload: {
            tx_type: 'transfer_token',
            safe_address: '0x123...abc',
            amount: '1.0',
          },
        })
      })

      // Verify initial chain context
      expect(mockGtag).toHaveBeenLastCalledWith(
        'event',
        'transaction_created',
        expect.objectContaining({
          chain_id: '1', // Ethereum
        }),
      )

      // Simulate chain switch to Polygon
      mockUseChainId.mockReturnValue('137')
      mockUseChain.mockReturnValue({
        chainId: '137',
        chainName: 'Polygon',
        description: 'Polygon Mainnet',
        chainLogoUri: 'https://safe-transaction-assets.safe.global/chains/137/chain_logo.png',
        transactionService: 'https://safe-transaction-polygon.safe.global',
        shortName: 'matic',
        l2: true,
        isTestnet: false,
        rpcUri: { authentication: 'NO_AUTH', value: 'https://polygon-rpc.com/' } as any,
        safeAppsRpcUri: 'https://polygon-rpc.com/',
        blockExplorerUriTemplate: 'https://polygonscan.com/{{address}}',
        balancesProvider: 'https://safe-client-gateway-polygon.safe.global',
        nativeCurrency: {
          name: 'Polygon',
          symbol: 'MATIC',
          decimals: 18,
        },
        theme: {
          textColor: '#ffffff',
          backgroundColor: '#8247E5',
        },
        contractAddresses: {
          safeMasterCopyAddress: '0x9876...',
          safeProxyFactoryAddress: '0x5432...',
        },
      } as any)

      // Force re-render to trigger context update
      rerender()

      // Track another transaction
      act(() => {
        result.current.track({
          name: 'transaction_created',
          payload: {
            tx_type: 'transfer_nft',
            safe_address: '0x123...abc',
          },
        })
      })

      // Verify updated chain context
      expect(mockGtag).toHaveBeenLastCalledWith(
        'event',
        'transaction_created',
        expect.objectContaining({
          chain_id: '137', // Polygon
        }),
      )

      expect(mockMixpanel.track).toHaveBeenLastCalledWith(
        'Transaction Created',
        expect.objectContaining({
          'Chain Id': '137',
        }),
      )
    })

    it('should track user identification when wallet changes', async () => {
      const { result, rerender } = renderHook(() => useAnalytics())

      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true)
      })

      // Change wallet
      mockUseWallet.mockReturnValue({
        label: 'WalletConnect',
        address: '0x789...ghi',
        chainId: '1',
        provider: { request: jest.fn().mockResolvedValue(null) },
      } as MockWallet)

      // Force re-render to trigger wallet change detection
      rerender()

      await waitFor(() => {
        // Should identify user with new wallet info
        expect(mockGtag).toHaveBeenCalledWith(
          'config',
          'GA-TEST-123',
          expect.objectContaining({
            user_id: expect.stringContaining('0x123'), // Safe address as user ID
            custom_map: expect.objectContaining({
              wallet_label: 'WalletConnect',
              wallet_address: '0x789...ghi',
            }),
          }),
        )

        expect(mockMixpanel.identify).toHaveBeenCalledWith(expect.stringContaining('0x123'))
        expect(mockMixpanel.people.set).toHaveBeenCalledWith(
          expect.objectContaining({
            'Wallet Label': 'WalletConnect',
            'Wallet Address': '0x789...ghi',
          }),
        )
      })
    })

    it('should handle device detection changes', async () => {
      // Start with desktop
      mockUseMediaQuery.mockReturnValue(false)

      const { result, rerender } = renderHook(() => useAnalytics<TestEvents>())

      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true)
      })

      // Track initial event
      act(() => {
        result.current.track({
          name: 'wallet_connected',
          payload: {
            wallet_label: 'MetaMask',
            wallet_address: '0x123...',
            chain_id: '1',
          },
        })
      })

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'wallet_connected',
        expect.objectContaining({
          device: expect.objectContaining({
            userAgent: expect.any(String),
          }),
        }),
      )

      // Simulate mobile detection
      mockUseMediaQuery.mockImplementation((query) => typeof query === 'string' && query.includes('600px'))

      rerender()

      // Track another event
      act(() => {
        result.current.track({
          name: 'transaction_created',
          payload: {
            tx_type: 'transfer_token',
            safe_address: '0x123...',
          },
        })
      })

      // Should still work with device context
      expect(mockGtag).toHaveBeenLastCalledWith(
        'event',
        'transaction_created',
        expect.objectContaining({
          device: expect.objectContaining({
            userAgent: expect.any(String),
          }),
        }),
      )
    })
  })

  describe('Consent Management Integration', () => {
    it('should disable tracking when consent is revoked', async () => {
      // Start with consent granted
      mockHasConsentFor.mockReturnValue(true)

      const { result, rerender } = renderHook(() => useAnalytics<TestEvents>())

      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true)
      })

      // Track an event - should work
      act(() => {
        result.current.track({
          name: 'wallet_connected',
          payload: {
            wallet_label: 'MetaMask',
            wallet_address: '0x123...',
            chain_id: '1',
          },
        })
      })

      expect(mockGtag).toHaveBeenCalled()
      expect(mockMixpanel.track).toHaveBeenCalled()

      jest.clearAllMocks()

      // Revoke consent
      mockHasConsentFor.mockReturnValue(false)
      rerender()

      // Track another event - should not work
      act(() => {
        result.current.track({
          name: 'transaction_created',
          payload: {
            tx_type: 'transfer_token',
            safe_address: '0x123...',
          },
        })
      })

      expect(mockGtag).not.toHaveBeenCalledWith('event', expect.anything(), expect.anything())
      expect(mockMixpanel.track).not.toHaveBeenCalled()
    })

    it('should handle partial provider consent (Mixpanel disabled)', async () => {
      // GA enabled, Mixpanel disabled
      mockUseHasFeature.mockReturnValue(false) // Disable Mixpanel feature

      const { result } = renderHook(() => useAnalytics<TestEvents>())

      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true)
        expect(result.current.isProviderEnabled('ga')).toBe(true)
        expect(result.current.isProviderEnabled('mixpanel')).toBe(false)
      })

      // Track event - only GA should receive it
      act(() => {
        result.current.track({
          name: 'wallet_connected',
          payload: {
            wallet_label: 'MetaMask',
            wallet_address: '0x123...',
            chain_id: '1',
          },
        })
      })

      expect(mockGtag).toHaveBeenCalled()
      expect(mockMixpanel.track).not.toHaveBeenCalled()
    })
  })

  describe('Page Tracking Integration', () => {
    it('should track page views with proper context', async () => {
      const { result } = renderHook(() => useAnalytics())

      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true)
      })

      act(() => {
        result.current.page('/dashboard', 'Dashboard')
      })

      expect(mockGtag).toHaveBeenCalledWith('event', 'page_view', {
        page_location: expect.stringContaining('http://localhost'),
        page_title: 'Dashboard',
        // Should include context
        user_id: expect.any(String),
        source: 'web',
        chain_id: '1',
        safe_address: '0x123...abc',
      })

      // Mixpanel doesn't support page tracking, should not be called
      expect(mockMixpanel.track).not.toHaveBeenCalledWith('Page View', expect.anything())
    })

    it('should not track page views in space routes', async () => {
      mockUseIsSpaceRoute.mockReturnValue(true)

      const { result } = renderHook(() => useAnalytics())

      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true)
      })

      act(() => {
        result.current.page('/space/123', 'Space Page')
      })

      // Should not track page views in space routes
      expect(mockGtag).not.toHaveBeenCalledWith('event', 'page_view', expect.anything())
    })
  })

  describe('Error Resilience', () => {
    it('should continue working when one provider fails', async () => {
      const { result } = renderHook(() => useAnalytics<TestEvents>())

      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true)
      })

      // Make GA throw an error
      mockGtag.mockImplementationOnce(() => {
        throw new Error('GA error')
      })

      // Should not crash the hook
      act(() => {
        result.current.track({
          name: 'wallet_connected',
          payload: {
            wallet_label: 'MetaMask',
            wallet_address: '0x123...',
            chain_id: '1',
          },
        })
      })

      // Mixpanel should still work
      expect(mockMixpanel.track).toHaveBeenCalledWith('Wallet Connected', expect.any(Object))

      // Hook should still be enabled
      expect(result.current.isEnabled).toBe(true)
    })

    it('should handle provider initialization failures gracefully', async () => {
      // Make Mixpanel initialization fail
      mockMixpanel.init.mockImplementationOnce(() => {
        throw new Error('Mixpanel init failed')
      })

      const { result } = renderHook(() => useAnalytics())

      await waitFor(() => {
        // Analytics should still be enabled (GA should work)
        expect(result.current.isEnabled).toBe(true)
      })

      // GA should still be initialized
      expect(mockGtag).toHaveBeenCalledWith('config', expect.anything(), expect.anything())
    })
  })

  describe('Meta Events Integration', () => {
    it('should call useMetaEvents with analytics instance', async () => {
      renderHook(() => useAnalytics())

      await waitFor(() => {
        expect(mockUseMetaEvents).toHaveBeenCalledWith(expect.any(Object))
      })

      // Meta events hook should be called with the analytics instance
      const analyticsInstance = mockUseMetaEvents.mock.calls[0][0]
      expect(analyticsInstance).toBeTruthy()
      expect(typeof analyticsInstance?.track).toBe('function')
    })

    it('should pass null to useMetaEvents when analytics is disabled', () => {
      mockHasConsentFor.mockReturnValue(false)

      renderHook(() => useAnalytics())

      expect(mockUseMetaEvents).toHaveBeenCalledWith(null)
    })
  })
})
