import { faker } from '@faker-js/faker'
import { renderHook } from '@testing-library/react'
import { useAddressBookCheck } from '../useAddressBookCheck'
import { AddressCheckMessages } from '../../config'
import { Severity } from '../../../../types'
import { useMemo } from 'react'

describe('useAddressBookCheck', () => {
  const mockChainId = '1'
  const mockAddress = faker.finance.ethereumAddress()

  const mockIsInAddressBook = jest.fn()
  const mockOwnedSafes: Record<string, string[]> = {}

  beforeEach(() => {
    jest.resetAllMocks()
    mockIsInAddressBook.mockReturnValue(false)
    mockOwnedSafes[mockChainId] = []
  })

  it('should return empty results when no addresses are provided', () => {
    const { result } = renderHook(() => {
      const addresses = useMemo(() => [], [])
      return useAddressBookCheck(mockChainId, addresses, mockIsInAddressBook, [])
    })

    expect(result.current).toEqual({})
  })

  it('should return result for address in address book', () => {
    mockIsInAddressBook.mockReturnValue(true)

    const { result } = renderHook(() => {
      const addresses = useMemo(() => [mockAddress], [])
      return useAddressBookCheck(mockChainId, addresses, mockIsInAddressBook, [])
    })

    expect(result.current[mockAddress]).toEqual({
      severity: Severity.OK,
      type: 'KNOWN_RECIPIENT',
      title: AddressCheckMessages.ADDRESS_BOOK.title,
      description: AddressCheckMessages.ADDRESS_BOOK.description,
    })
  })

  it('should return result for address in owned safes', () => {
    const { result } = renderHook(() => {
      const addresses = useMemo(() => [mockAddress], [])
      return useAddressBookCheck(mockChainId, addresses, mockIsInAddressBook, [mockAddress])
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

    const { result } = renderHook(() => {
      const addresses = useMemo(() => [mockAddress.toLowerCase()], [])
      return useAddressBookCheck(mockChainId, addresses, mockIsInAddressBook, [upperCaseAddress])
    })

    expect(result.current[mockAddress.toLowerCase()]).toEqual({
      severity: Severity.OK,
      type: 'KNOWN_RECIPIENT',
      title: AddressCheckMessages.OWNED_SAFE.title,
      description: AddressCheckMessages.OWNED_SAFE.description,
    })
  })

  it('should prioritize address book over owned safe', () => {
    mockIsInAddressBook.mockReturnValue(true)

    const { result } = renderHook(() => {
      const addresses = useMemo(() => [mockAddress], [])
      return useAddressBookCheck(mockChainId, addresses, mockIsInAddressBook, [mockAddress])
    })

    expect(result.current[mockAddress]).toEqual({
      severity: Severity.OK,
      type: 'KNOWN_RECIPIENT',
      title: AddressCheckMessages.ADDRESS_BOOK.title,
      description: AddressCheckMessages.ADDRESS_BOOK.description,
    })
  })

  it('should return unknown for address not in any source', () => {
    const { result } = renderHook(() => {
      const addresses = useMemo(() => [mockAddress], [])
      return useAddressBookCheck(mockChainId, addresses, mockIsInAddressBook, [])
    })

    expect(result.current[mockAddress]).toEqual({
      severity: Severity.INFO,
      type: 'UNKNOWN_RECIPIENT',
      title: AddressCheckMessages.UNKNOWN.title,
      description: AddressCheckMessages.UNKNOWN.description,
    })
  })

  it('should handle empty owned safes array for the chain', () => {
    const { result } = renderHook(() => {
      const addresses = useMemo(() => [mockAddress], [])
      return useAddressBookCheck(mockChainId, addresses, mockIsInAddressBook, [])
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

    mockIsInAddressBook.mockImplementation((addr: string) => addr === address1)

    const { result } = renderHook(() => {
      const addresses = useMemo(() => [address1, address2], [])
      return useAddressBookCheck(mockChainId, addresses, mockIsInAddressBook, [address2])
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

    mockIsInAddressBook.mockImplementation((addr: string) => addr === address1)

    const { result, rerender } = renderHook(
      ({ addrs }) => {
        const addresses = useMemo(() => addrs, [addrs])
        return useAddressBookCheck(mockChainId, addresses, mockIsInAddressBook, [])
      },
      { initialProps: { addrs: [address1] } },
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
