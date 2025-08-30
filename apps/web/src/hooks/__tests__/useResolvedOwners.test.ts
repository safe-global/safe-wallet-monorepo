import { renderHook, waitFor } from '@/tests/test-utils'
import useResolvedOwners from '../useResolvedOwners'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { lookupAddress } from '@/services/ens'
import { faker } from '@faker-js/faker'
import { addressExBuilder, extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { generateRandomArray } from '@/tests/builders/utils'
import { JsonRpcProvider } from 'ethers'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/wallets/web3')
jest.mock('@/services/ens')

const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const mockUseWeb3ReadOnly = useWeb3ReadOnly as jest.MockedFunction<typeof useWeb3ReadOnly>
const mockLookupAddress = lookupAddress as jest.MockedFunction<typeof lookupAddress>

describe('useResolvedOwners', () => {
  const mockProvider = new JsonRpcProvider()
  const safeAddress = faker.finance.ethereumAddress()

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('should return owners without ENS resolution when no provider is available', () => {
    const owners = generateRandomArray(() => addressExBuilder().build(), { min: 2, max: 3 })

    mockUseSafeInfo.mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({ address: { value: safeAddress } })
        .with({ owners })
        .build(),
      safeAddress,
      safeLoaded: true,
      safeLoading: false,
    })

    mockUseWeb3ReadOnly.mockReturnValue(undefined)

    const { result } = renderHook(() => useResolvedOwners())

    expect(result.current).toEqual(owners)
    expect(mockLookupAddress).not.toHaveBeenCalled()
  })

  it('should return owners without ENS resolution when no owners exist', () => {
    mockUseSafeInfo.mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({ address: { value: safeAddress } })
        .with({ owners: [] })
        .build(),
      safeAddress,
      safeLoaded: true,
      safeLoading: false,
    })

    mockUseWeb3ReadOnly.mockReturnValue(mockProvider)

    const { result } = renderHook(() => useResolvedOwners())

    expect(result.current).toEqual([])
    expect(mockLookupAddress).not.toHaveBeenCalled()
  })

  it('should resolve ENS names for owners when provider is available', async () => {
    const owners = [
      addressExBuilder().with({ value: '0x1234567890123456789012345678901234567890', name: '' }).build(),
      addressExBuilder().with({ value: '0x0987654321098765432109876543210987654321', name: '' }).build(),
    ]

    mockUseSafeInfo.mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({ address: { value: safeAddress } })
        .with({ owners })
        .build(),
      safeAddress,
      safeLoaded: true,
      safeLoading: false,
    })

    mockUseWeb3ReadOnly.mockReturnValue(mockProvider)
    mockLookupAddress.mockResolvedValueOnce('alice.eth').mockResolvedValueOnce('bob.eth')

    const { result } = renderHook(() => useResolvedOwners())

    await waitFor(() => {
      expect(result.current).toEqual([
        { ...owners[0], name: 'alice.eth' },
        { ...owners[1], name: 'bob.eth' },
      ])
    })

    expect(mockLookupAddress).toHaveBeenCalledTimes(2)
    expect(mockLookupAddress).toHaveBeenCalledWith(mockProvider, owners[0].value)
    expect(mockLookupAddress).toHaveBeenCalledWith(mockProvider, owners[1].value)
  })

  it('should preserve existing names and only resolve missing ones', async () => {
    const owners = [
      addressExBuilder().with({ value: '0x1234567890123456789012345678901234567890', name: 'Alice' }).build(),
      addressExBuilder().with({ value: '0x0987654321098765432109876543210987654321', name: '' }).build(),
    ]

    mockUseSafeInfo.mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({ address: { value: safeAddress } })
        .with({ owners })
        .build(),
      safeAddress,
      safeLoaded: true,
      safeLoading: false,
    })

    mockUseWeb3ReadOnly.mockReturnValue(mockProvider)
    mockLookupAddress.mockResolvedValueOnce('bob.eth')

    const { result } = renderHook(() => useResolvedOwners())

    await waitFor(() => {
      expect(result.current).toEqual([
        { ...owners[0], name: 'Alice' },
        { ...owners[1], name: 'bob.eth' },
      ])
    })

    expect(mockLookupAddress).toHaveBeenCalledTimes(1)
    expect(mockLookupAddress).toHaveBeenCalledWith(mockProvider, owners[1].value)
  })

  it('should handle ENS resolution errors gracefully', async () => {
    const owners = [
      addressExBuilder().with({ value: '0x1234567890123456789012345678901234567890', name: undefined }).build(),
      addressExBuilder().with({ value: '0x0987654321098765432109876543210987654321', name: undefined }).build(),
    ]

    mockUseSafeInfo.mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({ address: { value: safeAddress } })
        .with({ owners })
        .build(),
      safeAddress,
      safeLoaded: true,
      safeLoading: false,
    })

    mockUseWeb3ReadOnly.mockReturnValue(mockProvider)
    mockLookupAddress.mockRejectedValueOnce(new Error('ENS resolution failed')).mockResolvedValueOnce('bob.eth')

    const { result } = renderHook(() => useResolvedOwners())

    await waitFor(() => {
      expect(result.current).toEqual([
        { ...owners[0], name: undefined },
        { ...owners[1], name: 'bob.eth' },
      ])
    })

    expect(console.warn).toHaveBeenCalledWith(
      'Failed to resolve ENS name for address:',
      owners[0].value,
      expect.any(Error),
    )
    expect(mockLookupAddress).toHaveBeenCalledTimes(2)
  })

  it('should handle undefined ENS resolution results', async () => {
    const owners = [addressExBuilder().with({ value: '0x1234567890123456789012345678901234567890', name: '' }).build()]

    mockUseSafeInfo.mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({ address: { value: safeAddress } })
        .with({ owners })
        .build(),
      safeAddress,
      safeLoaded: true,
      safeLoading: false,
    })

    mockUseWeb3ReadOnly.mockReturnValue(mockProvider)
    mockLookupAddress.mockResolvedValueOnce(undefined)

    const { result } = renderHook(() => useResolvedOwners())

    await waitFor(() => {
      expect(result.current).toEqual([{ ...owners[0], name: undefined }])
    })

    expect(mockLookupAddress).toHaveBeenCalledTimes(1)
  })

  it('should return original owners when async operation is still pending', () => {
    const owners = generateRandomArray(() => addressExBuilder().build(), { min: 1, max: 2 })

    mockUseSafeInfo.mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({ address: { value: safeAddress } })
        .with({ owners })
        .build(),
      safeAddress,
      safeLoaded: true,
      safeLoading: false,
    })

    mockUseWeb3ReadOnly.mockReturnValue(mockProvider)
    // Don't resolve the promise immediately to test the fallback
    mockLookupAddress.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useResolvedOwners())

    // Should return original owners while async operation is pending
    expect(result.current).toEqual(owners)
  })
})
