import { renderHook } from '@testing-library/react-native'
import { useDisplayName } from '../useDisplayName'
import { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

jest.mock('@/src/store/hooks', () => ({
  useAppSelector: jest.fn(),
}))

jest.mock('@/src/store/addressBookSlice', () => ({
  selectContactByAddress: jest.fn(),
}))

const { useAppSelector } = require('@/src/store/hooks')
const { selectContactByAddress } = require('@/src/store/addressBookSlice')

const mockContact = { name: 'Alice Wallet', value: '0x123', chainIds: ['1'] }

describe('useDisplayName', () => {
  const testAddress = '0x1234567890abcdef1234567890abcdef12345678'
  const addressBookAddress = '0x123'

  beforeEach(() => {
    jest.clearAllMocks()
    selectContactByAddress.mockReturnValue(() => null)
  })

  it('should return address when value is a string', () => {
    useAppSelector.mockReturnValue(null)
    const { result } = renderHook(() => useDisplayName({ value: testAddress }))

    expect(result.current.address).toBe(testAddress)
    expect(result.current.displayName).toBeNull()
    expect(result.current.logoUri).toBeNull()
    expect(result.current.nameSource).toBeNull()
  })

  it('should prioritize address book name over CGW name', () => {
    useAppSelector.mockReturnValue(mockContact)

    const addressInfo: AddressInfo = {
      value: addressBookAddress,
      name: 'CGW Contract Name',
      logoUri: 'https://example.com/logo.png',
    }

    const { result } = renderHook(() => useDisplayName({ value: addressInfo }))

    expect(result.current.address).toBe(addressBookAddress)
    expect(result.current.displayName).toBe('Alice Wallet')
    expect(result.current.logoUri).toBe('https://example.com/logo.png')
    expect(result.current.nameSource).toBe('addressBook')
  })

  it('should use CGW name when no address book entry exists', () => {
    useAppSelector.mockReturnValue(null)

    const addressInfo: AddressInfo = {
      value: testAddress,
      name: 'CGW Contract Name',
      logoUri: 'https://example.com/logo.png',
    }

    const { result } = renderHook(() => useDisplayName({ value: addressInfo }))

    expect(result.current.address).toBe(testAddress)
    expect(result.current.displayName).toBe('CGW Contract Name')
    expect(result.current.logoUri).toBe('https://example.com/logo.png')
    expect(result.current.nameSource).toBe('cgw')
  })

  it('should return null when no name is available', () => {
    useAppSelector.mockReturnValue(null)

    const { result } = renderHook(() =>
      useDisplayName({
        value: testAddress,
      }),
    )

    expect(result.current.address).toBe(testAddress)
    expect(result.current.displayName).toBeNull()
    expect(result.current.logoUri).toBeNull()
    expect(result.current.nameSource).toBeNull()
  })

  it('should handle AddressInfo without name', () => {
    useAppSelector.mockReturnValue(null)

    const addressInfo: AddressInfo = {
      value: testAddress,
      logoUri: 'https://example.com/logo.png',
    }

    const { result } = renderHook(() => useDisplayName({ value: addressInfo }))

    expect(result.current.address).toBe(testAddress)
    expect(result.current.displayName).toBeNull()
    expect(result.current.logoUri).toBe('https://example.com/logo.png')
    expect(result.current.nameSource).toBeNull()
  })
})
