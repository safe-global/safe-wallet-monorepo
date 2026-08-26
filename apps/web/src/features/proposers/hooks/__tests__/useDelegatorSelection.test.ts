import { renderHook } from '@/tests/test-utils'
import { useDelegatorSelection } from '../useDelegatorSelection'
import {
  buildDelegatorOptions,
  resolveParentSafeAddress,
  isWalletDirectOwner,
  checkMultiSigRequired,
} from '../useDelegatorSelection'
import * as useWalletModule from '@/hooks/wallets/useWallet'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import * as useSafeInfoModule from '@/hooks/useSafeInfo'
import * as useNestedSafeOwnersModule from '@/hooks/useNestedSafeOwners'
import * as useParentSafeThresholdModule from '../useParentSafeThreshold'
import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'

describe('useDelegatorSelection pure functions', () => {
  describe('buildDelegatorOptions', () => {
    it('should include wallet address when direct owner', () => {
      expect(buildDelegatorOptions(true, '0xWallet', null)).toEqual(['0xWallet'])
    })

    it('should include nested owners', () => {
      expect(buildDelegatorOptions(false, '0xWallet', ['0xNested1', '0xNested2'])).toEqual(['0xNested1', '0xNested2'])
    })

    it('should include both wallet and nested owners', () => {
      expect(buildDelegatorOptions(true, '0xWallet', ['0xNested'])).toEqual(['0xWallet', '0xNested'])
    })

    it('should not include wallet when not direct owner', () => {
      expect(buildDelegatorOptions(false, '0xWallet', null)).toEqual([])
    })
  })

  describe('resolveParentSafeAddress', () => {
    const nested = checksumAddress(faker.finance.ethereumAddress())

    it('should return the address when delegator is a nested owner', () => {
      expect(resolveParentSafeAddress([nested], nested)).toBe(nested)
    })

    it('should return undefined when delegator is not a nested owner', () => {
      const other = checksumAddress(faker.finance.ethereumAddress())
      expect(resolveParentSafeAddress([nested], other)).toBeUndefined()
    })

    it('should return undefined when no nested owners', () => {
      expect(resolveParentSafeAddress(null, nested)).toBeUndefined()
    })
  })

  describe('isWalletDirectOwner', () => {
    const addr = checksumAddress(faker.finance.ethereumAddress())

    it('should return true when wallet is an owner', () => {
      expect(isWalletDirectOwner([{ value: addr }], addr)).toBe(true)
    })

    it('should return false when wallet is not an owner', () => {
      const other = checksumAddress(faker.finance.ethereumAddress())
      expect(isWalletDirectOwner([{ value: other }], addr)).toBe(false)
    })
  })

  describe('checkMultiSigRequired', () => {
    it('should return false when parentSafeAddress is undefined', () => {
      expect(checkMultiSigRequired(undefined, 2)).toBe(false)
    })

    it('should return false when threshold is undefined (still loading)', () => {
      expect(checkMultiSigRequired('0xParent', undefined)).toBe(false)
    })

    it('should return false when threshold is 1', () => {
      expect(checkMultiSigRequired('0xParent', 1)).toBe(false)
    })

    it('should return true when threshold > 1', () => {
      expect(checkMultiSigRequired('0xParent', 2)).toBe(true)
    })
  })
})

describe('useDelegatorSelection hook', () => {
  const walletAddress = checksumAddress(faker.finance.ethereumAddress())
  const nestedSafeAddress = checksumAddress(faker.finance.ethereumAddress())
  const ownerAddress = checksumAddress(faker.finance.ethereumAddress())

  const mockSafeInfo = {
    safe: {
      owners: [{ value: walletAddress }],
      threshold: 1,
      chainId: '1',
      address: { value: checksumAddress(faker.finance.ethereumAddress()) },
      nonce: 0,
    },
    safeAddress: checksumAddress(faker.finance.ethereumAddress()),
    safeLoading: false,
    safeLoaded: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(useWalletModule, 'default').mockReturnValue({
      address: walletAddress,
      label: 'MetaMask',
      chainId: '1',
    } as ConnectedWallet)
    jest
      .spyOn(useSafeInfoModule, 'default')
      .mockReturnValue(mockSafeInfo as ReturnType<typeof useSafeInfoModule.default>)
  })

  it('should return isParentLoading=false when no nested Safe', () => {
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue(null)
    jest.spyOn(useParentSafeThresholdModule, 'useParentSafeThreshold').mockReturnValue({
      threshold: undefined,
      owners: undefined,
      parentSafeAddress: undefined,
      isLoading: false,
    })

    const { result } = renderHook(() => useDelegatorSelection())

    expect(result.current.isParentLoading).toBe(false)
    expect(result.current.isMultiSigRequired).toBe(false)
  })

  it('should return isParentLoading=true while parent Safe threshold is loading', () => {
    // Wallet is NOT a direct owner, so nestedSafeAddress becomes the default delegator
    jest.spyOn(useSafeInfoModule, 'default').mockReturnValue({
      ...mockSafeInfo,
      safe: { ...mockSafeInfo.safe, owners: [{ value: ownerAddress }] },
    } as ReturnType<typeof useSafeInfoModule.default>)
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([nestedSafeAddress])
    jest.spyOn(useParentSafeThresholdModule, 'useParentSafeThreshold').mockReturnValue({
      threshold: undefined,
      owners: undefined,
      parentSafeAddress: undefined,
      isLoading: true,
    })

    const { result } = renderHook(() => useDelegatorSelection())

    expect(result.current.isParentLoading).toBe(true)
    // Key: isMultiSigRequired is false while loading, so consumers must
    // gate on isParentLoading to avoid taking the wrong signing path.
    expect(result.current.isMultiSigRequired).toBe(false)
  })

  it('should return isMultiSigRequired=true once threshold loads and is > 1', () => {
    // Wallet is NOT a direct owner, so nestedSafeAddress becomes the default delegator
    jest.spyOn(useSafeInfoModule, 'default').mockReturnValue({
      ...mockSafeInfo,
      safe: { ...mockSafeInfo.safe, owners: [{ value: ownerAddress }] },
    } as ReturnType<typeof useSafeInfoModule.default>)
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([nestedSafeAddress])
    jest.spyOn(useParentSafeThresholdModule, 'useParentSafeThreshold').mockReturnValue({
      threshold: 2,
      owners: [
        { value: ownerAddress, name: null, logoUri: null },
        { value: walletAddress, name: null, logoUri: null },
      ],
      parentSafeAddress: nestedSafeAddress,
      isLoading: false,
    })

    const { result } = renderHook(() => useDelegatorSelection())

    expect(result.current.isParentLoading).toBe(false)
    expect(result.current.isMultiSigRequired).toBe(true)
    expect(result.current.parentThreshold).toBe(2)
  })

  it('should return isMultiSigRequired=false for single-sig nested Safe', () => {
    // Wallet is NOT a direct owner, so nestedSafeAddress becomes the default delegator
    jest.spyOn(useSafeInfoModule, 'default').mockReturnValue({
      ...mockSafeInfo,
      safe: { ...mockSafeInfo.safe, owners: [{ value: ownerAddress }] },
    } as ReturnType<typeof useSafeInfoModule.default>)
    jest.spyOn(useNestedSafeOwnersModule, 'useNestedSafeOwners').mockReturnValue([nestedSafeAddress])
    jest.spyOn(useParentSafeThresholdModule, 'useParentSafeThreshold').mockReturnValue({
      threshold: 1,
      owners: [{ value: walletAddress, name: null, logoUri: null }],
      parentSafeAddress: nestedSafeAddress,
      isLoading: false,
    })

    const { result } = renderHook(() => useDelegatorSelection())

    expect(result.current.isParentLoading).toBe(false)
    expect(result.current.isMultiSigRequired).toBe(false)
  })
})
