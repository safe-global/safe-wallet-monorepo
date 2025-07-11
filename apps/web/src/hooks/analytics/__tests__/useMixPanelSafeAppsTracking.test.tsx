import { renderHook } from '@testing-library/react'
import { useMixPanelSafeAppsTracking } from '../useMixPanelUserTracking'
import { trackMixPanelEvent } from '@/services/analytics/mixpanel-tracking'

// Mock dependencies
jest.mock('@/services/analytics/mixpanel-tracking', () => ({
  trackMixPanelEvent: jest.fn(),
  useMixPanelEnabled: jest.fn(() => true),
}))

jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: () => ({
    chainName: 'Ethereum',
  }),
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({
    safe: {
      address: { value: '0x1234567890123456789012345678901234567890' },
      version: '1.3.0',
      nonce: 5,
      threshold: 2,
      owners: [
        { value: '0x1234567890123456789012345678901234567890' },
        { value: '0x0987654321098765432109876543210987654321' },
      ],
    },
    safeAddress: '0x1234567890123456789012345678901234567890',
    safeLoaded: true,
  }),
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => ({
    address: '0x1234567890123456789012345678901234567890',
  }),
}))

jest.mock('@/store', () => ({
  useAppSelector: () => ({
    results: [],
  }),
}))

jest.mock('@/services/analytics/user-attributes', () => ({
  useSafeUserAttributes: () => ({
    safe_id: '0x1234567890123456789012345678901234567890',
    safe_version: '1.3.0',
    num_signers: 2,
    threshold: 2,
    networks: ['ethereum'],
    total_tx_count: 10,
    created_at: new Date('2023-01-01'),
    last_tx_at: new Date('2023-12-01'),
    space_id: null,
    nested_safe_ids: [],
  }),
}))

describe('useMixPanelSafeAppsTracking', () => {
  const mockTrackMixPanelEvent = trackMixPanelEvent as jest.MockedFunction<typeof trackMixPanelEvent>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should track AppLaunched event with correct properties', () => {
    const { result } = renderHook(() => useMixPanelSafeAppsTracking())

    // Mock isTracking to be true
    result.current.isTracking = true

    // Call trackAppLaunched
    result.current.trackAppLaunched('Test App', 'defi', 'dashboard')

    // Verify trackMixPanelEvent was called with correct parameters
    expect(mockTrackMixPanelEvent).toHaveBeenCalledWith('AppLaunched', {
      safe_id: '0x1234567890123456789012345678901234567890',
      network: 'ethereum',
      app_name: 'Test App',
      app_category: 'defi',
      entry_point: 'dashboard',
      'Safe ID': '0x1234567890123456789012345678901234567890',
      'Safe Version': '1.3.0',
      Network: 'ethereum',
      'Number of Signers': 2,
      Threshold: 2,
      'Total Transaction Count': 10,
    })
  })

  it('should not track AppLaunched event when tracking is disabled', () => {
    const { result } = renderHook(() => useMixPanelSafeAppsTracking())

    // Mock isTracking to be false
    result.current.isTracking = false

    // Call trackAppLaunched
    result.current.trackAppLaunched('Test App', 'defi', 'dashboard')

    // Verify trackMixPanelEvent was not called
    expect(mockTrackMixPanelEvent).not.toHaveBeenCalled()
  })

  it('should use default values for missing parameters', () => {
    const { result } = renderHook(() => useMixPanelSafeAppsTracking())

    // Mock isTracking to be true
    result.current.isTracking = true

    // Call trackAppLaunched with minimal parameters
    result.current.trackAppLaunched('Test App')

    // Verify trackMixPanelEvent was called with default values
    expect(mockTrackMixPanelEvent).toHaveBeenCalledWith('AppLaunched', {
      safe_id: '0x1234567890123456789012345678901234567890',
      network: 'ethereum',
      app_name: 'Test App',
      app_category: 'unknown',
      entry_point: 'unknown',
      'Safe ID': '0x1234567890123456789012345678901234567890',
      'Safe Version': '1.3.0',
      Network: 'ethereum',
      'Number of Signers': 2,
      Threshold: 2,
      'Total Transaction Count': 10,
    })
  })
})
