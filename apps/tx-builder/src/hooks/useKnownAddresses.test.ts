import { renderHook, act, waitFor } from '@testing-library/react'

import { useKnownAddresses, _resetKnownAddressesCache } from './useKnownAddresses'

const CONTACT_1 = '0x680cde08860141F9D223cE4E620B10Cd6741037E'
const CONTACT_2 = '0x9913B9180C20C6b0F21B6480c84422F6ebc4B808'

const mockRequestAddressBook = jest.fn()

jest.mock('@safe-global/safe-apps-react-sdk', () => ({
  useSafeAppsSDK: () => ({
    sdk: { safe: { requestAddressBook: () => mockRequestAddressBook() } },
    safe: {
      safeAddress: '0x1234000000000000000000000000000000000000',
      chainId: 1,
      owners: [],
      threshold: 1,
      isReadOnly: false,
    },
  }),
}))

describe('useKnownAddresses', () => {
  beforeEach(() => {
    _resetKnownAddressesCache()
    mockRequestAddressBook.mockReset()
    mockRequestAddressBook.mockResolvedValue([
      { address: CONTACT_1, name: 'Alice', chainId: '1' },
      { address: CONTACT_2, name: 'Treasury', chainId: '1' },
    ])
  })

  it('does not fetch the address book on mount', () => {
    const { result } = renderHook(() => useKnownAddresses())

    expect(mockRequestAddressBook).not.toHaveBeenCalled()
    expect(result.current.knownAddresses).toEqual([])
  })

  it('exposes the address book once loaded', async () => {
    const { result } = renderHook(() => useKnownAddresses())

    act(() => {
      result.current.loadAddressBook()
    })

    await waitFor(() => {
      expect(result.current.knownAddresses).toEqual([
        { address: CONTACT_1, name: 'Alice' },
        { address: CONTACT_2, name: 'Treasury' },
      ])
    })
  })

  it('fetches once across repeated calls and hook instances', async () => {
    const first = renderHook(() => useKnownAddresses())
    const second = renderHook(() => useKnownAddresses())

    act(() => {
      first.result.current.loadAddressBook()
      first.result.current.loadAddressBook()
      second.result.current.loadAddressBook()
    })

    await waitFor(() => {
      expect(first.result.current.knownAddresses).toHaveLength(2)
      expect(second.result.current.knownAddresses).toHaveLength(2)
    })
    expect(mockRequestAddressBook).toHaveBeenCalledTimes(1)
  })

  it('returns no addresses when the permission is rejected', async () => {
    mockRequestAddressBook.mockRejectedValue(new Error('Permissions rejected'))
    const { result } = renderHook(() => useKnownAddresses())

    act(() => {
      result.current.loadAddressBook()
    })

    await waitFor(() => {
      expect(mockRequestAddressBook).toHaveBeenCalled()
    })
    expect(result.current.knownAddresses).toEqual([])
  })

  it('filters out wrong-chain and invalid entries', async () => {
    mockRequestAddressBook.mockResolvedValue([
      { address: CONTACT_1, name: 'Alice', chainId: '100' },
      { address: 'not-an-address', name: 'Broken', chainId: '1' },
      { address: CONTACT_2, name: 'Treasury', chainId: '1' },
    ])
    const { result } = renderHook(() => useKnownAddresses())

    act(() => {
      result.current.loadAddressBook()
    })

    await waitFor(() => {
      expect(result.current.knownAddresses).toEqual([{ address: CONTACT_2, name: 'Treasury' }])
    })
  })
})
