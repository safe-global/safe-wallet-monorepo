import { faker } from '@faker-js/faker'
import { renderHook } from '@testing-library/react'
import { useAddressBookCheck } from '../useAddressBookCheck'
import { AddressCheckMessages } from '../../config'
import { Severity } from '../../../../types'
import * as useChainIdHook from '@/hooks/useChainId'
import * as useAllAddressBooksHook from '@/hooks/useAllAddressBooks'
import * as useOwnedSafesHook from '@/hooks/useOwnedSafes'
import type { MergedAddressBook } from '@/hooks/useAllAddressBooks'
import { useMemo } from 'react'

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

  it('should return empty results when no addresses are provided', () => {
    jest.spyOn(useAllAddressBooksHook, 'useMergedAddressBooks').mockReturnValue(mockMergedAddressBooks(false))
    jest.spyOn(useOwnedSafesHook, 'default').mockReturnValue({ [mockChainId]: [] })

    const { result } = renderHook(() => {
      const addresses = useMemo(() => [], [])
      return useAddressBookCheck(addresses)
    })

    expect(result.current).toEqual({})
  })

  it('should return result for address in address book', () => {
    jest.spyOn(useAllAddressBooksHook, 'useMergedAddressBooks').mockReturnValue(mockMergedAddressBooks(true))
    jest.spyOn(useOwnedSafesHook, 'default').mockReturnValue({ [mockChainId]: [] })

    const { result } = renderHook(() => {
      const addresses = useMemo(() => [mockAddress], [])
      return useAddressBookCheck(addresses)
    })

    expect(result.current[mockAddress]).toEqual({
      severity: Severity.OK,
      type: 'KNOWN_RECIPIENT',
      title: AddressCheckMessages.ADDRESS_BOOK.title,
      description: AddressCheckMessages.ADDRESS_BOOK.description,
    })
  })

  it('should return result for address in owned safes', () => {
    jest.spyOn(useAllAddressBooksHook, 'useMergedAddressBooks').mockReturnValue(mockMergedAddressBooks(false))
    jest.spyOn(useOwnedSafesHook, 'default').mockReturnValue({ [mockChainId]: [mockAddress] })

    const { result } = renderHook(() => {
      const addresses = useMemo(() => [mockAddress], [])
      return useAddressBookCheck(addresses)
    })

    expect(result.current[mockAddress]).toEqual({
      severity: Severity.OK,
      type: 'KNOWN_RECIPIENT',
      title: AddressCheckMessages.OWNED_SAFE.title,
      description: AddressCheckMessages.OWNED_SAFE.description,
    })
  })

  it('should handle case-insensitive address matching for owned safes', () => {
    const upperCaseAddress = mockAddress.toUpperCase()
    jest.spyOn(useAllAddressBooksHook, 'useMergedAddressBooks').mockReturnValue(mockMergedAddressBooks(false))
    jest.spyOn(useOwnedSafesHook, 'default').mockReturnValue({ [mockChainId]: [upperCaseAddress] })

    const { result } = renderHook(() => {
      const addresses = useMemo(() => [mockAddress.toLowerCase()], [])
      return useAddressBookCheck(addresses)
    })

    expect(result.current[mockAddress.toLowerCase()]).toEqual({
      severity: Severity.OK,
      type: 'KNOWN_RECIPIENT',
      title: AddressCheckMessages.OWNED_SAFE.title,
      description: AddressCheckMessages.OWNED_SAFE.description,
    })
  })

  it('should prioritize address book over owned safe', () => {
    jest.spyOn(useAllAddressBooksHook, 'useMergedAddressBooks').mockReturnValue(mockMergedAddressBooks(true))
    jest.spyOn(useOwnedSafesHook, 'default').mockReturnValue({ [mockChainId]: [mockAddress] })

    const { result } = renderHook(() => {
      const addresses = useMemo(() => [mockAddress], [])
      return useAddressBookCheck(addresses)
    })

    expect(result.current[mockAddress]).toEqual({
      severity: Severity.OK,
      type: 'KNOWN_RECIPIENT',
      title: AddressCheckMessages.ADDRESS_BOOK.title,
      description: AddressCheckMessages.ADDRESS_BOOK.description,
    })
  })

  it('should return unknown for address not in any source', () => {
    jest.spyOn(useAllAddressBooksHook, 'useMergedAddressBooks').mockReturnValue(mockMergedAddressBooks(false))
    jest.spyOn(useOwnedSafesHook, 'default').mockReturnValue({ [mockChainId]: [] })

    const { result } = renderHook(() => {
      const addresses = useMemo(() => [mockAddress], [])
      return useAddressBookCheck(addresses)
    })

    expect(result.current[mockAddress]).toEqual({
      severity: Severity.INFO,
      type: 'UNKNOWN_RECIPIENT',
      title: AddressCheckMessages.UNKNOWN.title,
      description: AddressCheckMessages.UNKNOWN.description,
    })
  })

  it('should handle empty owned safes array for the chain', () => {
    jest.spyOn(useAllAddressBooksHook, 'useMergedAddressBooks').mockReturnValue(mockMergedAddressBooks(false))
    jest.spyOn(useOwnedSafesHook, 'default').mockReturnValue({})

    const { result } = renderHook(() => {
      const addresses = useMemo(() => [mockAddress], [])
      return useAddressBookCheck(addresses)
    })

    expect(result.current[mockAddress]).toEqual({
      severity: Severity.INFO,
      type: 'UNKNOWN_RECIPIENT',
      title: AddressCheckMessages.UNKNOWN.title,
      description: AddressCheckMessages.UNKNOWN.description,
    })
  })

  it('should handle multiple addresses', () => {
    const address1 = faker.finance.ethereumAddress()
    const address2 = faker.finance.ethereumAddress()

    const mergedAddressBooks = mockMergedAddressBooks(false)
    ;(mergedAddressBooks.has as jest.Mock).mockImplementation((addr: string) => {
      return addr === address1
    })

    jest.spyOn(useAllAddressBooksHook, 'useMergedAddressBooks').mockReturnValue(mergedAddressBooks)
    jest.spyOn(useOwnedSafesHook, 'default').mockReturnValue({ [mockChainId]: [address2] })

    const { result } = renderHook(() => {
      const addresses = useMemo(() => [address1, address2], [])
      return useAddressBookCheck(addresses)
    })

    expect(result.current[address1]).toEqual({
      severity: Severity.OK,
      type: 'KNOWN_RECIPIENT',
      title: AddressCheckMessages.ADDRESS_BOOK.title,
      description: AddressCheckMessages.ADDRESS_BOOK.description,
    })

    expect(result.current[address2]).toEqual({
      severity: Severity.OK,
      type: 'KNOWN_RECIPIENT',
      title: AddressCheckMessages.OWNED_SAFE.title,
      description: AddressCheckMessages.OWNED_SAFE.description,
    })
  })

  it('should re-check when addresses change', () => {
    const address1 = faker.finance.ethereumAddress()
    const address2 = faker.finance.ethereumAddress()

    const mergedAddressBooks = mockMergedAddressBooks(false)
    ;(mergedAddressBooks.has as jest.Mock).mockImplementation((addr: string) => {
      return addr === address1
    })

    jest.spyOn(useAllAddressBooksHook, 'useMergedAddressBooks').mockReturnValue(mergedAddressBooks)
    jest.spyOn(useOwnedSafesHook, 'default').mockReturnValue({ [mockChainId]: [] })

    const { result, rerender } = renderHook(
      ({ addrs }) => {
        const addresses = useMemo(() => addrs, [addrs])
        return useAddressBookCheck(addresses)
      },
      {
        initialProps: { addrs: [address1] },
      },
    )

    expect(result.current[address1]).toEqual({
      severity: Severity.OK,
      type: 'KNOWN_RECIPIENT',
      title: AddressCheckMessages.ADDRESS_BOOK.title,
      description: AddressCheckMessages.ADDRESS_BOOK.description,
    })

    rerender({ addrs: [address2] })

    expect(result.current[address2]).toEqual({
      severity: Severity.INFO,
      type: 'UNKNOWN_RECIPIENT',
      title: AddressCheckMessages.UNKNOWN.title,
      description: AddressCheckMessages.UNKNOWN.description,
    })
    expect(result.current[address1]).toBeUndefined()
  })
})
