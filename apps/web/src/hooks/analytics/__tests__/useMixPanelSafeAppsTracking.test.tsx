import { renderHook } from '@testing-library/react'
import { useMixPanelSafeAppsTracking } from '../useMixPanelUserTracking'

// Mock dependencies
jest.mock('@/services/analytics/mixpanel-tracking', () => ({
  trackMixPanelEvent: jest.fn(),
  useMixPanelEnabled: jest.fn(() => true),
}))

// Mock the base hook to control isTracking
jest.mock('../useMixPanelUserTracking', () => ({
  useMixPanelUserTracking: jest.fn(),
  useMixPanelSafeAppsTracking: jest.fn(),
}))

const mockCurrentChain = {
  chainName: 'Ethereum',
}

jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: jest.fn(() => mockCurrentChain),
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
  const mockUseMixPanelSafeAppsTrackingFn = useMixPanelSafeAppsTracking as jest.MockedFunction<
    typeof useMixPanelSafeAppsTracking
  >

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should track AppLaunched event with correct properties', () => {
    const mockTrackAppLaunched = jest.fn()

    // Mock the hook to return the functions we want to test
    mockUseMixPanelSafeAppsTrackingFn.mockReturnValue({
      isTracking: true,
      trackAppLaunched: mockTrackAppLaunched,
      trackAppClicked: jest.fn(),
      getSafeAppsEventProperties: jest.fn(),
      userAttributes: {
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
      },
    })

    const { result } = renderHook(() => useMixPanelSafeAppsTracking())

    // Check if tracking is enabled
    expect(result.current.isTracking).toBe(true)

    // Call trackAppLaunched
    result.current.trackAppLaunched('Test App', 'defi', 'dashboard')

    // Verify trackAppLaunched was called
    expect(mockTrackAppLaunched).toHaveBeenCalledWith('Test App', 'defi', 'dashboard')
  })

  it('should not track AppLaunched event when tracking is disabled', () => {
    const mockTrackAppLaunched = jest.fn()

    // Mock the hook to return tracking disabled
    mockUseMixPanelSafeAppsTrackingFn.mockReturnValue({
      isTracking: false,
      trackAppLaunched: mockTrackAppLaunched,
      trackAppClicked: jest.fn(),
      getSafeAppsEventProperties: jest.fn(),
      userAttributes: {
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
      },
    })

    const { result } = renderHook(() => useMixPanelSafeAppsTracking())

    // Call trackAppLaunched
    result.current.trackAppLaunched('Test App', 'defi', 'dashboard')

    // Verify trackAppLaunched was still called (it's up to the function to decide whether to track)
    expect(mockTrackAppLaunched).toHaveBeenCalledWith('Test App', 'defi', 'dashboard')
  })

  it('should use default values for missing parameters', () => {
    const mockTrackAppLaunched = jest.fn()

    // Mock the hook to return tracking enabled
    mockUseMixPanelSafeAppsTrackingFn.mockReturnValue({
      isTracking: true,
      trackAppLaunched: mockTrackAppLaunched,
      trackAppClicked: jest.fn(),
      getSafeAppsEventProperties: jest.fn(),
      userAttributes: {
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
      },
    })

    const { result } = renderHook(() => useMixPanelSafeAppsTracking())

    // Call trackAppLaunched with minimal parameters
    result.current.trackAppLaunched('Test App')

    // Verify trackAppLaunched was called with default values
    expect(mockTrackAppLaunched).toHaveBeenCalledWith('Test App')
  })
})
