import { useAddressResolver } from '@/hooks/useAddressResolver'
import * as addressBook from '@/hooks/useAddressBook'
import { zeroPadValue } from 'ethers'
import * as domains from '@/services/ens'
import * as ud from '@/services/ud'
import * as web3 from '@/hooks/wallets/web3'
import * as useChains from '@/hooks/useChains'
import { renderHook, waitFor } from '@/tests/test-utils'
import { JsonRpcProvider } from 'ethers'

const ADDRESS1 = zeroPadValue('0x01', 20)
const ADDRESS2 = zeroPadValue('0x02', 20)
const mockProvider = new JsonRpcProvider()

describe('useAddressResolver', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(web3, 'useWeb3ReadOnly').mockImplementation(() => mockProvider)
  })

  it('returns address book name if found, not resolving domain', async () => {
    jest.spyOn(addressBook, 'default').mockReturnValue({
      [ADDRESS1]: 'Testname',
    })
    const ensMock = jest.spyOn(domains, 'lookupAddress').mockImplementation(() => {
      return Promise.resolve('test.eth')
    })
    const udMock = jest.spyOn(ud, 'reverseResolveUnstoppable').mockImplementation(() => {
      return Promise.resolve('test.crypto')
    })

    const { result } = renderHook(() => useAddressResolver(ADDRESS1))

    await waitFor(() => {
      expect(result.current.ens).toBeUndefined()
      expect(result.current.name).toBe('Testname')
      expect(result.current.resolving).toBe(false)
      expect(ensMock).toHaveBeenCalledTimes(0)
      expect(udMock).toHaveBeenCalledTimes(0)
    })
  })

  it('resolves ENS domain if no address book name is found', async () => {
    jest.spyOn(addressBook, 'default').mockReturnValue({})
    const ensMock = jest.spyOn(domains, 'lookupAddress').mockImplementation(() => {
      return Promise.resolve('test.eth')
    })
    const udMock = jest.spyOn(ud, 'reverseResolveUnstoppable').mockImplementation(() => {
      return Promise.resolve(undefined)
    })

    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)

    const { result } = renderHook(() => useAddressResolver(ADDRESS1))

    await waitFor(() => {
      expect(result.current.ens).toBe('test.eth')
      expect(result.current.name).toBeUndefined()
      expect(result.current.resolving).toBe(false)
      expect(ensMock).toHaveBeenCalledTimes(1)
      expect(udMock).toHaveBeenCalledTimes(0) // Should not call UD if ENS found
    })
  })

  it('falls back to UD if ENS returns nothing', async () => {
    jest.spyOn(addressBook, 'default').mockReturnValue({})
    const ensMock = jest.spyOn(domains, 'lookupAddress').mockImplementation(() => {
      return Promise.resolve(undefined)
    })
    const udMock = jest.spyOn(ud, 'reverseResolveUnstoppable').mockImplementation(() => {
      return Promise.resolve('test.crypto')
    })

    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)

    const { result } = renderHook(() => useAddressResolver(ADDRESS2))

    await waitFor(() => {
      expect(result.current.ens).toBe('test.crypto')
      expect(result.current.name).toBeUndefined()
      expect(result.current.resolving).toBe(false)
      expect(ensMock).toHaveBeenCalledTimes(1)
      expect(udMock).toHaveBeenCalledTimes(1)
    })
  })

  it('does not resolve domain if feature is disabled', async () => {
    jest.spyOn(addressBook, 'default').mockReturnValue({})
    const ensMock = jest.spyOn(domains, 'lookupAddress').mockImplementation(() => {
      return Promise.resolve('test.eth')
    })
    const udMock = jest.spyOn(ud, 'reverseResolveUnstoppable').mockImplementation(() => {
      return Promise.resolve('test.crypto')
    })
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)

    const { result } = renderHook(() => useAddressResolver(ADDRESS1))

    await waitFor(() => {
      expect(result.current.ens).toBeUndefined()
      expect(result.current.name).toBeUndefined()
      expect(result.current.resolving).toBe(false)
      expect(ensMock).toHaveBeenCalledTimes(0)
      expect(udMock).toHaveBeenCalledTimes(0)
    })
  })
})
