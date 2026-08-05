import { useAddressResolver } from '@/hooks/useAddressResolver'
import * as addressBook from '@/hooks/useAddressBook'
import { zeroPadValue } from 'ethers'
import * as domains from '@/services/ens'
import * as web3ReadOnly from '@/hooks/wallets/web3ReadOnly'
import * as web3 from '@/hooks/wallets/web3'
import * as useChains from '@/hooks/useChains'
import { renderHook, waitFor, act } from '@/tests/test-utils'
import { JsonRpcProvider } from 'ethers'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { ETH_COIN_TYPE } from '@safe-global/utils/utils/ens'

const ADDRESS1 = zeroPadValue('0x01', 20)
const mockProvider = new JsonRpcProvider()
const mockHubProvider = { destroy: jest.fn() } as unknown as JsonRpcProvider

const createChain = (overrides: Partial<Chain>): Chain =>
  ({
    chainId: '1',
    shortName: 'eth',
    isTestnet: false,
    features: [FEATURES.DOMAIN_LOOKUP],
    ...overrides,
  }) as unknown as Chain

describe('useAddressResolver', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(web3ReadOnly, 'useWeb3ReadOnly').mockImplementation(() => mockProvider)
    jest.spyOn(web3, 'createWeb3ReadOnly').mockReturnValue(mockHubProvider)
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(createChain({ chainId: '1' }))
    jest.spyOn(useChains, 'useChain').mockImplementation((chainId: string) => createChain({ chainId }))
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

  it('resolves ENS domain on the hub when no address book name is found', async () => {
    jest.spyOn(addressBook, 'default').mockReturnValue({})
    const domainsMock = jest.spyOn(domains, 'lookupAddress').mockImplementation(() => {
      return Promise.resolve('test.eth')
    })

    const { result } = renderHook(() => useAddressResolver(ADDRESS1))

    await waitFor(() => {
      expect(result.current.ens).toBe('test.eth')
      expect(result.current.name).toBeUndefined()
      expect(result.current.resolving).toBe(false)
      expect(domainsMock).toHaveBeenCalledWith(mockProvider, ADDRESS1, ETH_COIN_TYPE)
    })
  })

  it('creates a dedicated hub provider when the current chain is not the ENS hub', async () => {
    // Unique address avoids the module-level ENS cache populated by earlier tests
    const ADDR_ON_L2 = zeroPadValue('0xcc', 20)
    jest.spyOn(addressBook, 'default').mockReturnValue({})
    jest
      .spyOn(useChains, 'useCurrentChain')
      .mockReturnValue(createChain({ chainId: '8453', isTestnet: false, features: [] }))
    jest
      .spyOn(useChains, 'useChain')
      .mockImplementation((chainId: string) =>
        createChain({ chainId, features: chainId === '1' ? [FEATURES.DOMAIN_LOOKUP] : [] }),
      )
    const domainsMock = jest.spyOn(domains, 'lookupAddress').mockResolvedValue('base.eth')

    const { result } = renderHook(() => useAddressResolver(ADDR_ON_L2))

    await waitFor(() => {
      expect(result.current.ens).toBe('base.eth')
    })

    expect(web3.createWeb3ReadOnly).toHaveBeenCalled()
    expect(domainsMock).toHaveBeenCalledWith(mockHubProvider, ADDR_ON_L2, ETH_COIN_TYPE)
  })

  it('clears stale ENS when switching to a different address', async () => {
    jest.useFakeTimers()

    // Use unique addresses to avoid module-level cache from other tests
    const ADDR_WITH_ENS = zeroPadValue('0xaa', 20)
    const ADDR_WITHOUT_ENS = zeroPadValue('0xbb', 20)

    jest.spyOn(addressBook, 'default').mockReturnValue({})
    const lookupMock = jest.spyOn(domains, 'lookupAddress').mockImplementation((_provider, address) => {
      if (address === ADDR_WITH_ENS) return Promise.resolve('first.eth')
      return Promise.resolve(undefined)
    })

    const { result, rerender } = renderHook(({ address }) => useAddressResolver(address), {
      initialProps: { address: ADDR_WITH_ENS },
    })

    // Advance past debounce and flush microtasks for first resolve
    await act(async () => {
      await jest.advanceTimersByTimeAsync(200)
    })

    expect(result.current.ens).toBe('first.eth')
    expect(lookupMock).toHaveBeenCalledWith(mockProvider, ADDR_WITH_ENS, ETH_COIN_TYPE)

    // Switch to a different address
    rerender({ address: ADDR_WITHOUT_ENS })

    // ENS should be cleared immediately, not show stale 'first.eth'
    expect(result.current.ens).toBeUndefined()

    // Advance past debounce so the new address resolves
    await act(async () => {
      await jest.advanceTimersByTimeAsync(200)
    })

    // Verify lookup was called for the new address and ENS is still undefined
    expect(lookupMock).toHaveBeenCalledWith(mockProvider, ADDR_WITHOUT_ENS, ETH_COIN_TYPE)
    expect(result.current.ens).toBeUndefined()

    jest.useRealTimers()
  })

  it('does not resolve ENS domain if hub domain lookup is disabled', async () => {
    jest.spyOn(addressBook, 'default').mockReturnValue({})
    jest.spyOn(useChains, 'useChain').mockReturnValue(createChain({ chainId: '1', features: [] }))
    const domainsMock = jest.spyOn(domains, 'lookupAddress').mockImplementation(() => {
      return Promise.resolve('test.eth')
    })

    const { result } = renderHook(() => useAddressResolver(ADDRESS1))

    await waitFor(() => {
      expect(result.current.ens).toBeUndefined()
      expect(result.current.name).toBeUndefined()
      expect(result.current.resolving).toBe(false)
      expect(domainsMock).toHaveBeenCalledTimes(0)
    })
  })
})
