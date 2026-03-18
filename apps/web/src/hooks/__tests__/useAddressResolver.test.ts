import { useAddressResolver } from '@/hooks/useAddressResolver'
import * as addressBook from '@/hooks/useAddressBook'
import { zeroPadValue } from 'ethers'
import * as domains from '@/services/ens'
import * as web3ReadOnly from '@/hooks/wallets/web3ReadOnly'
import * as useChains from '@/hooks/useChains'
import { renderHook, waitFor } from '@/tests/test-utils'
import { JsonRpcProvider } from 'ethers'

const ADDRESS1 = zeroPadValue('0x01', 20)
const mockProvider = new JsonRpcProvider()

describe('useAddressResolver', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(web3ReadOnly, 'useWeb3ReadOnly').mockImplementation(() => mockProvider)
  })

  it('returns address book name if found, not resolving ENS domain', async () => {
    jest.spyOn(addressBook, 'default').mockReturnValue({
      [ADDRESS1]: 'Testname',
    })
    const domainsMock = jest.spyOn(domains, 'lookupAddress').mockImplementation(() => {
      return Promise.resolve('test.eth')
    })

    const { result } = renderHook(() => useAddressResolver(ADDRESS1))

    await waitFor(() => {
      expect(result.current.ens).toBeUndefined()
      expect(result.current.name).toBe('Testname')
      expect(result.current.resolving).toBe(false)
      expect(domainsMock).toHaveBeenCalledTimes(0)
    })
  })

  it('resolves ENS domain if no address book name is found', async () => {
    jest.spyOn(addressBook, 'default').mockReturnValue({})
    const domainsMock = jest.spyOn(domains, 'lookupAddress').mockImplementation(() => {
      return Promise.resolve('test.eth')
    })

    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)

    const { result } = renderHook(() => useAddressResolver(ADDRESS1))

    await waitFor(() => {
      expect(result.current.ens).toBe('test.eth')
      expect(result.current.name).toBeUndefined()
      expect(result.current.resolving).toBe(false)
      expect(domainsMock).toHaveBeenCalledTimes(1)
    })
  })

  it('clears stale ENS when switching to a different address', async () => {
    // Use unique addresses to avoid module-level cache from other tests
    const ADDR_WITH_ENS = zeroPadValue('0xaa', 20)
    const ADDR_WITHOUT_ENS = zeroPadValue('0xbb', 20)

    jest.spyOn(addressBook, 'default').mockReturnValue({})
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)
    jest.spyOn(domains, 'lookupAddress').mockImplementation((_provider, address) => {
      if (address === ADDR_WITH_ENS) return Promise.resolve('first.eth')
      return Promise.resolve(undefined)
    })

    const { result, rerender } = renderHook(({ address }) => useAddressResolver(address), {
      initialProps: { address: ADDR_WITH_ENS },
    })

    // Wait for first ENS to resolve
    await waitFor(() => {
      expect(result.current.ens).toBe('first.eth')
    })

    // Switch to a different address
    rerender({ address: ADDR_WITHOUT_ENS })

    // ENS should be cleared immediately, not show stale 'first.eth'
    expect(result.current.ens).toBeUndefined()

    // After debounce settles, should still be undefined (no ENS for ADDRESS2)
    await waitFor(() => {
      expect(result.current.ens).toBeUndefined()
    })
  })

  it('does not resolve ENS domain if feature is disabled', async () => {
    jest.spyOn(addressBook, 'default').mockReturnValue({})
    const domainsMock = jest.spyOn(domains, 'lookupAddress').mockImplementation(() => {
      return Promise.resolve('test.eth')
    })
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)

    const { result } = renderHook(() => useAddressResolver(ADDRESS1))

    await waitFor(() => {
      expect(result.current.ens).toBeUndefined()
      expect(result.current.name).toBeUndefined()
      expect(result.current.resolving).toBe(false)
      expect(domainsMock).toHaveBeenCalledTimes(0)
    })
  })
})
