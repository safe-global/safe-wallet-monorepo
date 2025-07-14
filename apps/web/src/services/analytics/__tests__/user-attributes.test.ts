import { renderHook } from '@testing-library/react'
import { useSafeUserAttributes, prepareMixPanelUserAttributes, getSafeEventProperties } from '../user-attributes'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'

// Mock the hooks and selectors
jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: () => ({ chainName: 'Ethereum', chainId: '1' }),
}))

jest.mock('@/store', () => ({
  useAppSelector: (selector: any) => {
    if (selector.name === 'selectAllAddedSafes') {
      return { '1': { '0x123': {} } }
    }
    if (selector.name === 'selectTxHistory') {
      return {
        data: {
          results: [
            {
              transaction: {
                executionDate: '2023-01-01T00:00:00Z',
                submissionDate: '2023-01-01T00:00:00Z',
              },
            },
          ],
        },
      }
    }
    return {}
  },
}))

jest.mock('@/store/chainsSlice', () => ({
  selectChainById: () => ({ chainName: 'Ethereum' }),
}))

jest.mock('date-fns', () => ({
  parseISO: jest.fn().mockReturnValue(new Date('2023-01-01T00:00:00Z')),
  fromUnixTime: jest.fn().mockReturnValue(new Date('2022-01-01T00:00:00Z')),
}))

describe('useSafeUserAttributes', () => {
  const mockSafeInfo: ExtendedSafeInfo = {
    ...defaultSafeInfo,
    address: { value: '0x123' },
    owners: [{ value: '0xOwner1' }, { value: '0xOwner2' }],
    threshold: 2,
    version: '1.3.0',
    txQueuedTag: '5',
    modules: null,
    guard: null,
    fallbackHandler: null,
    implementation: { value: '1640995200' }, // Unix timestamp
  }

  const mockWalletAddress = '0xOwner1'

  it('should return user attributes when safe info is available', () => {
    const { result } = renderHook(() => useSafeUserAttributes(mockSafeInfo, mockWalletAddress))

    expect(result.current).toEqual(
      expect.objectContaining({
        safe_id: '0x123',
        safe_version: '1.3.0',
        num_signers: 2,
        threshold: 2,
        networks: ['ethereum'],
        space_id: null,
        nested_safe_ids: [],
        total_tx_count: 5,
      }),
    )
  })

  it('should return null when safe info is not available', () => {
    const { result } = renderHook(() => useSafeUserAttributes(null, mockWalletAddress))

    expect(result.current).toBeNull()
  })

  it('should return null when wallet address is not available', () => {
    const { result } = renderHook(() => useSafeUserAttributes(mockSafeInfo, undefined))

    expect(result.current).toBeNull()
  })
})

describe('prepareMixPanelUserAttributes', () => {
  it('should convert Date objects to ISO strings', () => {
    const attributes = {
      safe_id: '0x123',
      created_at: new Date('2022-01-01T00:00:00Z'),
      safe_version: '1.3.0',
      num_signers: 2,
      threshold: 2,
      networks: ['ethereum'],
      last_tx_at: new Date('2023-01-01T00:00:00Z'),
      space_id: null,
      nested_safe_ids: [],
      total_tx_count: 5,
    }

    const result = prepareMixPanelUserAttributes(attributes)

    expect(result['Created at']).toBe('2022-01-01T00:00:00.000Z')
    expect(result['Last Transaction at']).toBe('2023-01-01T00:00:00.000Z')
    expect(result['Safe Address']).toBe('0x123')
  })

  it('should handle null last_tx_at', () => {
    const attributes = {
      safe_id: '0x123',
      created_at: new Date('2022-01-01T00:00:00Z'),
      safe_version: '1.3.0',
      num_signers: 2,
      threshold: 2,
      networks: ['ethereum'],
      last_tx_at: null,
      space_id: null,
      nested_safe_ids: [],
      total_tx_count: 0,
    }

    const result = prepareMixPanelUserAttributes(attributes)

    expect(result['Last Transaction at']).toBeNull()
  })
})

describe('getSafeEventProperties', () => {
  const mockSafeInfo: ExtendedSafeInfo = {
    ...defaultSafeInfo,
    address: { value: '0x123' },
    owners: [{ value: '0xOwner1' }],
    version: '1.3.0',
  }

  it('should return event properties when safe info is available', () => {
    const result = getSafeEventProperties(mockSafeInfo, 'Ethereum')

    expect(result).toEqual({
      'Safe Address': '0x123',
      'Safe Version': '1.3.0',
      Network: 'ethereum',
    })
  })

  it('should return null when safe info is not available', () => {
    const result = getSafeEventProperties(null, 'Ethereum')

    expect(result).toBeNull()
  })
})
