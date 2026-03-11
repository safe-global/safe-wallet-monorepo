import * as allOwnedSafes from '@/hooks/safes/useAllOwnedSafes'
import * as useChains from '@/hooks/useChains'
import * as useWallet from '@/hooks/wallets/useWallet'
import { renderHook } from '@/tests/test-utils'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { UndeployedSafe } from '@safe-global/utils/features/counterfactual/store/types'
import useOnboardingSafes from '../useOnboardingSafes'

describe('useOnboardingSafes', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(allOwnedSafes, 'default').mockReturnValue([{}, undefined, false])
    jest.spyOn(useChains, 'default').mockImplementation(() => ({
      configs: [{ chainId: '1' } as Chain],
    }))
    jest.spyOn(useWallet, 'default').mockReturnValue({
      address: '0xWallet',
    } as ReturnType<typeof useWallet.default>)
  })

  it('returns empty lists when there are no safes', () => {
    const { result } = renderHook(() => useOnboardingSafes())

    expect(result.current.trustedSafes).toEqual([])
    expect(result.current.ownedSafes).toEqual([])
    expect(result.current.similarAddresses.size).toBe(0)
  })

  it('returns trusted safes from addedSafes', () => {
    const { result } = renderHook(() => useOnboardingSafes(), {
      initialReduxState: {
        addedSafes: {
          '1': {
            '0xTrusted1': { owners: [], threshold: 1 },
            '0xTrusted2': { owners: [], threshold: 2 },
          },
        },
      },
    })

    expect(result.current.trustedSafes).toHaveLength(2)
    expect(result.current.trustedSafes.map((s) => s.address)).toEqual(
      expect.arrayContaining(['0xTrusted1', '0xTrusted2']),
    )
  })

  it('returns owned safes from API', () => {
    const mockOwned = { '1': ['0xOwned1', '0xOwned2'] }
    jest.spyOn(allOwnedSafes, 'default').mockReturnValue([mockOwned, undefined, false])

    const { result } = renderHook(() => useOnboardingSafes())

    expect(result.current.ownedSafes).toHaveLength(2)
    expect(result.current.ownedSafes.map((s) => s.address)).toEqual(
      expect.arrayContaining(['0xOwned1', '0xOwned2']),
    )
  })

  it('includes undeployed safes in owned list', () => {
    const { result } = renderHook(() => useOnboardingSafes(), {
      initialReduxState: {
        undeployedSafes: {
          '1': {
            '0xUndeployed': {
              status: {} as UndeployedSafe['status'],
              props: {
                safeAccountConfig: { owners: ['0xWallet'] },
              } as UndeployedSafe['props'],
            },
          },
        },
      },
    })

    expect(result.current.ownedSafes).toHaveLength(1)
    expect(result.current.ownedSafes[0].address).toBe('0xUndeployed')
  })

  it('excludes trusted safes from owned list', () => {
    const mockOwned = { '1': ['0xShared', '0xOnlyOwned'] }
    jest.spyOn(allOwnedSafes, 'default').mockReturnValue([mockOwned, undefined, false])

    const { result } = renderHook(() => useOnboardingSafes(), {
      initialReduxState: {
        addedSafes: {
          '1': {
            '0xShared': { owners: [], threshold: 1 },
          },
        },
      },
    })

    expect(result.current.trustedSafes).toHaveLength(1)
    expect(result.current.trustedSafes[0].address).toBe('0xShared')

    expect(result.current.ownedSafes).toHaveLength(1)
    expect(result.current.ownedSafes[0].address).toBe('0xOnlyOwned')
  })

  it('handles multiple chains', () => {
    jest.spyOn(useChains, 'default').mockImplementation(() => ({
      configs: [{ chainId: '1' } as Chain, { chainId: '137' } as Chain],
    }))

    const mockOwned = { '1': ['0xSafe1'], '137': ['0xSafe2'] }
    jest.spyOn(allOwnedSafes, 'default').mockReturnValue([mockOwned, undefined, false])

    const { result } = renderHook(() => useOnboardingSafes())

    expect(result.current.ownedSafes).toHaveLength(2)
  })

  it('groups multi-chain safes with same address', () => {
    jest.spyOn(useChains, 'default').mockImplementation(() => ({
      configs: [{ chainId: '1' } as Chain, { chainId: '137' } as Chain],
    }))

    const mockOwned = { '1': ['0xMulti'], '137': ['0xMulti'] }
    jest.spyOn(allOwnedSafes, 'default').mockReturnValue([mockOwned, undefined, false])

    const { result } = renderHook(() => useOnboardingSafes())

    // Should be grouped into one multi-chain item
    expect(result.current.ownedSafes).toHaveLength(1)
    expect(result.current.ownedSafes[0].address).toBe('0xMulti')
    expect('safes' in result.current.ownedSafes[0]).toBe(true)
  })

  describe('similar address detection', () => {
    it('returns empty set when fewer than 2 unique addresses', () => {
      const mockOwned = { '1': ['0xSingle'] }
      jest.spyOn(allOwnedSafes, 'default').mockReturnValue([mockOwned, undefined, false])

      const { result } = renderHook(() => useOnboardingSafes())

      expect(result.current.similarAddresses.size).toBe(0)
    })

    it('returns empty set when addresses are not similar', () => {
      const mockOwned = {
        '1': [
          '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        ],
      }
      jest.spyOn(allOwnedSafes, 'default').mockReturnValue([mockOwned, undefined, false])

      const { result } = renderHook(() => useOnboardingSafes())

      expect(result.current.similarAddresses.size).toBe(0)
    })

    it('detects similar addresses across trusted and owned safes', () => {
      // Same 6-char prefix and 4-char suffix, differ only in middle
      const addr1 = '0x1234567890abcdef1234567890abcdef12345678'
      const addr2 = '0x123456eeeeeeeeee1234567890abcdef12345678'

      const mockOwned = { '1': [addr2] }
      jest.spyOn(allOwnedSafes, 'default').mockReturnValue([mockOwned, undefined, false])

      const { result } = renderHook(() => useOnboardingSafes(), {
        initialReduxState: {
          addedSafes: {
            '1': {
              [addr1]: { owners: [], threshold: 1 },
            },
          },
        },
      })

      // Both should be flagged
      expect(result.current.similarAddresses.has(addr1.toLowerCase())).toBe(true)
      expect(result.current.similarAddresses.has(addr2.toLowerCase())).toBe(true)
    })
  })
})
