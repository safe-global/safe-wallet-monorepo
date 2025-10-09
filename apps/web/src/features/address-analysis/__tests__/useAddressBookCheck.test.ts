import { faker } from '@faker-js/faker'
import { renderHook, waitFor } from '@testing-library/react'
import { useAddressBookCheck, AddressCheckDescription, AddressCheckSeverity } from '../useAddressBookCheck'
import * as useChainIdHook from '@/hooks/useChainId'
import * as useAllAddressBooksHook from '@/hooks/useAllAddressBooks'
import * as useOwnedSafesHook from '@/hooks/useOwnedSafes'
import type { MergedAddressBook } from '@/hooks/useAllAddressBooks'

jest.mock('@/hooks/useChainId')
jest.mock('@/hooks/useAllAddressBooks')
jest.mock('@/hooks/useOwnedSafes')

describe('useAddressBookCheck', () => {
  const mockChainId = '1'
  const mockAddress = faker.finance.ethereumAddress()

  const mockMergedAddressBooks = (hasContact: boolean): MergedAddressBook => ({
    list: [],
    get: jest.fn(),
    has: jest.fn().mockReturnValue(hasContact),
    getFromLocal: jest.fn(),
    getFromSpace: jest.fn(),
  })

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(useChainIdHook, 'default').mockReturnValue(mockChainId)
  })

  it('should return all false when address is not provided', async () => {
    jest.spyOn(useAllAddressBooksHook, 'useMergedAddressBooks').mockReturnValue(mockMergedAddressBooks(false))
    jest.spyOn(useOwnedSafesHook, 'default').mockReturnValue({ [mockChainId]: [] })

    const { result } = renderHook(() => useAddressBookCheck(undefined))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isKnownAddress).toBe(false)
    expect(result.current.isAddressBookContact).toBe(false)
    expect(result.current.isOwnedSafe).toBe(false)
    expect(result.current.description).toBe(AddressCheckDescription.UNKNOWN)
    expect(result.current.severity).toBe(AddressCheckSeverity.INFO)
    expect(result.current.error).toBeUndefined()
  })

  it('should return true for isAddressBookContact when address is in address book', async () => {
    jest.spyOn(useAllAddressBooksHook, 'useMergedAddressBooks').mockReturnValue(mockMergedAddressBooks(true))
    jest.spyOn(useOwnedSafesHook, 'default').mockReturnValue({ [mockChainId]: [] })

    const { result } = renderHook(() => useAddressBookCheck(mockAddress))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isKnownAddress).toBe(true)
    expect(result.current.isAddressBookContact).toBe(true)
    expect(result.current.isOwnedSafe).toBe(false)
    expect(result.current.description).toBe(AddressCheckDescription.ADDRESS_BOOK)
    expect(result.current.severity).toBe(AddressCheckSeverity.OK)
  })

  it('should return true for isOwnedSafe when address is in owned safes', async () => {
    jest.spyOn(useAllAddressBooksHook, 'useMergedAddressBooks').mockReturnValue(mockMergedAddressBooks(false))
    jest.spyOn(useOwnedSafesHook, 'default').mockReturnValue({ [mockChainId]: [mockAddress] })

    const { result } = renderHook(() => useAddressBookCheck(mockAddress))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isKnownAddress).toBe(true)
    expect(result.current.isAddressBookContact).toBe(false)
    expect(result.current.isOwnedSafe).toBe(true)
    expect(result.current.description).toBe(AddressCheckDescription.OWNED_SAFE)
    expect(result.current.severity).toBe(AddressCheckSeverity.OK)
  })

  it('should handle case-insensitive address matching for owned safes', async () => {
    const upperCaseAddress = mockAddress.toUpperCase()
    jest.spyOn(useAllAddressBooksHook, 'useMergedAddressBooks').mockReturnValue(mockMergedAddressBooks(false))
    jest.spyOn(useOwnedSafesHook, 'default').mockReturnValue({ [mockChainId]: [upperCaseAddress] })

    const { result } = renderHook(() => useAddressBookCheck(mockAddress.toLowerCase()))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isOwnedSafe).toBe(true)
    expect(result.current.isKnownAddress).toBe(true)
  })

  it('should return true for all checks when address is in all sources', async () => {
    jest.spyOn(useAllAddressBooksHook, 'useMergedAddressBooks').mockReturnValue(mockMergedAddressBooks(true))
    jest.spyOn(useOwnedSafesHook, 'default').mockReturnValue({ [mockChainId]: [mockAddress] })

    const { result } = renderHook(() => useAddressBookCheck(mockAddress))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isKnownAddress).toBe(true)
    expect(result.current.isAddressBookContact).toBe(true)
    expect(result.current.isOwnedSafe).toBe(true)
    expect(result.current.description).toBe(AddressCheckDescription.ADDRESS_BOOK)
    expect(result.current.severity).toBe(AddressCheckSeverity.OK)
  })

  it('should return false for all checks when address is not in any source', async () => {
    jest.spyOn(useAllAddressBooksHook, 'useMergedAddressBooks').mockReturnValue(mockMergedAddressBooks(false))
    jest.spyOn(useOwnedSafesHook, 'default').mockReturnValue({ [mockChainId]: [] })

    const { result } = renderHook(() => useAddressBookCheck(mockAddress))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isKnownAddress).toBe(false)
    expect(result.current.isAddressBookContact).toBe(false)
    expect(result.current.isOwnedSafe).toBe(false)
    expect(result.current.description).toBe(AddressCheckDescription.UNKNOWN)
    expect(result.current.severity).toBe(AddressCheckSeverity.INFO)
  })

  it('should handle empty owned safes array for the chain', async () => {
    jest.spyOn(useAllAddressBooksHook, 'useMergedAddressBooks').mockReturnValue(mockMergedAddressBooks(false))
    jest.spyOn(useOwnedSafesHook, 'default').mockReturnValue({})

    const { result } = renderHook(() => useAddressBookCheck(mockAddress))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isOwnedSafe).toBe(false)
    expect(result.current.isKnownAddress).toBe(false)
  })

  it('should re-check when address changes', async () => {
    const address1 = faker.finance.ethereumAddress()
    const address2 = faker.finance.ethereumAddress()

    const mergedAddressBooks = mockMergedAddressBooks(false)
    ;(mergedAddressBooks.has as jest.Mock).mockImplementation((addr: string) => {
      return addr === address1
    })

    jest.spyOn(useAllAddressBooksHook, 'useMergedAddressBooks').mockReturnValue(mergedAddressBooks)
    jest.spyOn(useOwnedSafesHook, 'default').mockReturnValue({ [mockChainId]: [] })

    const { result, rerender } = renderHook(({ addr }) => useAddressBookCheck(addr), {
      initialProps: { addr: address1 },
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.isAddressBookContact).toBe(true)
    expect(result.current.isKnownAddress).toBe(true)

    rerender({ addr: address2 })

    await waitFor(() => {
      expect(result.current.isAddressBookContact).toBe(false)
    })

    expect(result.current.isKnownAddress).toBe(false)
  })
})
