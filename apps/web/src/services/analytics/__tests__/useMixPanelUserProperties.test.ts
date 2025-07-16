import { renderHook } from '@testing-library/react'
import { useMixPanelUserProperties } from '../useMixPanelUserProperties'
import { MixPanelUserProperty } from '@/services/analytics/mixpanel-events'

// Mock dependencies
jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: jest.fn(() => ({
    chainName: 'Ethereum',
    chainId: '1',
  })),
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    safe: {
      address: { value: '0x1234567890123456789012345678901234567890' },
      version: '1.3.0',
      owners: [
        { value: '0x1234567890123456789012345678901234567890' },
        { value: '0x0987654321098765432109876543210987654321' },
      ],
      threshold: 2,
      nonce: 42,
    },
    safeLoaded: true,
  })),
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

describe('useMixPanelUserProperties', () => {
  it('should return correct user properties', () => {
    const { result } = renderHook(() => useMixPanelUserProperties())

    expect(result.current).toEqual({
      properties: {
        [MixPanelUserProperty.SAFE_ADDRESS]: '0x1234567890123456789012345678901234567890',
        [MixPanelUserProperty.SAFE_VERSION]: '1.3.0',
        [MixPanelUserProperty.NUM_SIGNERS]: 2,
        [MixPanelUserProperty.THRESHOLD]: 2,
        [MixPanelUserProperty.TOTAL_TX_COUNT]: 42,
        [MixPanelUserProperty.LAST_TX_AT]: new Date(1672531200000).toISOString(),
      },
      networks: ['ethereum'],
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
        address: { value: '0x1234567890123456789012345678901234567890' },
        version: null,
        owners: [{ value: '0x1234567890123456789012345678901234567890' }],
        threshold: 1,
        nonce: 5,
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
        address: { value: '0x1234567890123456789012345678901234567890' },
        version: '1.3.0',
        owners: [{ value: '0x1234567890123456789012345678901234567890' }],
        threshold: 1,
        nonce: 10, // nonce is still used for total_tx_count
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
})
