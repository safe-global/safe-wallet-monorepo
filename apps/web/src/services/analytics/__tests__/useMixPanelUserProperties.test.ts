import { renderHook } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { useMixPanelUserProperties } from '../useMixPanelUserProperties'
import { MixPanelUserProperty } from '@/services/analytics/mixpanel-events'

// Mock dependencies
jest.mock('@/hooks/useChains', () => ({
  useChain: jest.fn((chainId: string) => {
    const chains: Record<string, { chainName: string; chainId: string }> = {
      '1': { chainName: 'Ethereum', chainId: '1' },
      '137': { chainName: 'Polygon', chainId: '137' },
    }
    return chains[chainId] || null
  }),
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/store', () => ({
  useAppSelector: jest.fn(() => ({
    data: {
      results: [
        {
          type: 'TRANSACTION',
          transaction: {
            id: 'tx2',
            timestamp: 1672531200000, // Jan 1, 2023 (most recent first)
          },
        },
        {
          type: 'TRANSACTION',
          transaction: {
            id: 'tx1',
            timestamp: 1640995200000, // Jan 1, 2022
          },
        },
      ],
    },
  })),
}))

jest.mock('@/utils/transaction-guards', () => ({
  isTransactionListItem: jest.fn((item) => item.type === 'TRANSACTION'),
}))

jest.mock('@/features/myAccounts/hooks/useNetworksOfSafe', () => ({
  useNetworksOfSafe: jest.fn(() => ['ethereum', 'polygon']),
}))

describe('useMixPanelUserProperties', () => {
  // Generate test addresses
  const safeAddress = faker.finance.ethereumAddress()
  const owner1Address = faker.finance.ethereumAddress()
  const owner2Address = faker.finance.ethereumAddress()

  // Update mocks with generated addresses
  beforeEach(() => {
    const useSafeInfo = require('@/hooks/useSafeInfo').default
    useSafeInfo.mockReturnValue({
      safe: {
        address: { value: safeAddress },
        version: '1.3.0',
        owners: [{ value: owner1Address }, { value: owner2Address }],
        threshold: 2,
        nonce: 42,
        chainId: '1',
      },
      safeLoaded: true,
    })
  })

  it('should return correct user properties', () => {
    const { result } = renderHook(() => useMixPanelUserProperties())

    expect(result.current).toEqual({
      properties: {
        [MixPanelUserProperty.SAFE_ADDRESS]: safeAddress,
        [MixPanelUserProperty.SAFE_VERSION]: '1.3.0',
        [MixPanelUserProperty.NUM_SIGNERS]: 2,
        [MixPanelUserProperty.THRESHOLD]: 2,
        [MixPanelUserProperty.TOTAL_TX_COUNT]: 42,
        [MixPanelUserProperty.LAST_TX_AT]: new Date(1672531200000).toISOString(),
        [MixPanelUserProperty.NETWORKS]: ['ethereum', 'polygon'],
      },
      networks: ['ethereum', 'polygon'],
    })
  })

  it('should return null when safe is not loaded', () => {
    const useSafeInfo = require('@/hooks/useSafeInfo').default
    useSafeInfo.mockReturnValueOnce({
      safe: null,
      safeLoaded: false,
    })

    const { result } = renderHook(() => useMixPanelUserProperties())

    expect(result.current).toBeNull()
  })

  it('should handle safe without version', () => {
    const useSafeInfo = require('@/hooks/useSafeInfo').default
    useSafeInfo.mockReturnValueOnce({
      safe: {
        address: { value: safeAddress },
        version: null,
        owners: [{ value: owner1Address }],
        threshold: 1,
        nonce: 5,
        chainId: '1',
      },
      safeLoaded: true,
    })

    const { result } = renderHook(() => useMixPanelUserProperties())

    expect(result.current?.properties[MixPanelUserProperty.SAFE_VERSION]).toBe('unknown')
  })

  it('should handle empty transaction history', () => {
    const useSafeInfo = require('@/hooks/useSafeInfo').default
    useSafeInfo.mockReturnValueOnce({
      safe: {
        address: { value: safeAddress },
        version: '1.3.0',
        owners: [{ value: owner1Address }],
        threshold: 1,
        nonce: 10, // nonce is still used for total_tx_count
        chainId: '1',
      },
      safeLoaded: true,
    })

    const { useAppSelector } = require('@/store')
    useAppSelector.mockReturnValueOnce({
      data: {
        results: [], // empty transaction history
      },
    })

    const { result } = renderHook(() => useMixPanelUserProperties())

    expect(result.current?.properties[MixPanelUserProperty.TOTAL_TX_COUNT]).toBe(10) // from nonce
    expect(result.current?.properties[MixPanelUserProperty.LAST_TX_AT]).toBeNull() // from empty tx history
  })

  it('should fallback to current chain when useNetworksOfSafe returns empty array', () => {
    const { useNetworksOfSafe } = require('@/features/myAccounts/hooks/useNetworksOfSafe')
    useNetworksOfSafe.mockReturnValueOnce([])

    const { result } = renderHook(() => useMixPanelUserProperties())

    expect(result.current?.networks).toEqual(['Ethereum'])
  })
})
