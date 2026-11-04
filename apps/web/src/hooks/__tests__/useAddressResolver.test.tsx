import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import { renderHook, waitFor } from '@testing-library/react'
import { zeroPadValue, type JsonRpcProvider } from 'ethers'
import { apiSliceWithChainsConfig, chainsAdapter, chainsInitialState } from '@safe-global/store/gateway'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { ETH_COIN_TYPE } from '@safe-global/utils/utils/ens'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import * as addressBook from '@/hooks/useAddressBook'
import { useAddressResolver } from '@/hooks/useAddressResolver'
import * as useChains from '@/hooks/useChains'
import { getReadOnlyProvider } from '@/hooks/wallets/getReadOnlyProvider'
import { makeStore } from '@/store'
import { chainBuilder } from '@/tests/builders/chains'

jest.mock('@/hooks/wallets/getReadOnlyProvider', () => ({ getReadOnlyProvider: jest.fn() }))
jest.mock('@/services/exceptions', () => ({ logError: jest.fn() }))

const ADDRESS = zeroPadValue('0x01', 20)
const OTHER_ADDRESS = zeroPadValue('0x02', 20)

const mainnet = chainBuilder()
  .with({ chainId: '1', isTestnet: false, features: [FEATURES.DOMAIN_LOOKUP] })
  .build()
const sepolia = chainBuilder()
  .with({ chainId: '11155111', isTestnet: true, features: [FEATURES.DOMAIN_LOOKUP] })
  .build()
const base = chainBuilder().with({ chainId: '8453', isTestnet: false, features: [] }).build()

const mockGetProvider = getReadOnlyProvider as jest.MockedFunction<typeof getReadOnlyProvider>
const lookupAddress = jest.fn()

let currentChain: Chain = mainnet
let knownChains: Chain[] = [mainnet, sepolia, base]

const setupStore = async () => {
  const store = makeStore()
  await store.dispatch(
    apiSliceWithChainsConfig.util.upsertQueryData(
      'getChainsConfigV2',
      CONFIG_SERVICE_KEY,
      chainsAdapter.setAll(chainsInitialState, knownChains),
    ),
  )
  return store
}

const renderResolver = (store: Awaited<ReturnType<typeof setupStore>>, address?: string) => {
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>
  return renderHook(({ address }) => useAddressResolver(address), { wrapper, initialProps: { address } })
}

describe('useAddressResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    currentChain = mainnet
    knownChains = [mainnet, sepolia, base]
    jest.spyOn(addressBook, 'default').mockReturnValue({})
    jest.spyOn(useChains, 'useCurrentChain').mockImplementation(() => currentChain)
    jest
      .spyOn(useChains, 'useChain')
      .mockImplementation((chainId: string) => knownChains.find((chain) => chain.chainId === chainId))
    mockGetProvider.mockResolvedValue({ lookupAddress } as unknown as JsonRpcProvider)
    lookupAddress.mockResolvedValue('test.eth')
  })

  it('returns the address book name without an ENS lookup', async () => {
    jest.spyOn(addressBook, 'default').mockReturnValue({ [ADDRESS]: 'Testname' })

    const { result } = renderResolver(await setupStore(), ADDRESS)

    expect(result.current).toEqual({ name: 'Testname', ens: undefined, resolving: false })
    expect(lookupAddress).not.toHaveBeenCalled()
  })

  it('resolves the primary name on the ENS hub', async () => {
    const { result } = renderResolver(await setupStore(), ADDRESS)

    await waitFor(() => {
      expect(result.current.ens).toBe('test.eth')
    })
    expect(result.current.resolving).toBe(false)
    expect(mockGetProvider).toHaveBeenCalledWith(mainnet, undefined)
    expect(lookupAddress).toHaveBeenCalledWith(ADDRESS, ETH_COIN_TYPE)
  })

  it('looks up the name of an address on an L2 on the mainnet hub', async () => {
    currentChain = base

    const { result } = renderResolver(await setupStore(), ADDRESS)

    await waitFor(() => {
      expect(result.current.ens).toBe('test.eth')
    })
    expect(mockGetProvider).toHaveBeenCalledWith(mainnet, undefined)
  })

  it('reports resolving on every render from the first one until the lookup ends', async () => {
    let endLookup: (name: string | null) => void = () => {}
    lookupAddress.mockImplementation(() => new Promise((resolve) => (endLookup = resolve)))
    const store = await setupStore()
    const renderedResolving: boolean[] = []
    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>

    renderHook(
      () => {
        const resolved = useAddressResolver(ADDRESS)
        renderedResolving.push(resolved.resolving)
        return resolved
      },
      { wrapper },
    )
    await waitFor(() => {
      expect(lookupAddress).toHaveBeenCalled()
    })

    expect(renderedResolving).not.toContain(false)

    endLookup('test.eth')
    await waitFor(() => {
      expect(renderedResolving[renderedResolving.length - 1]).toBe(false)
    })
  })

  it('clears the name of the previous address as soon as the address changes', async () => {
    lookupAddress.mockImplementation((address: string) =>
      address === ADDRESS ? Promise.resolve('first.eth') : new Promise(() => {}),
    )
    const { result, rerender } = renderResolver(await setupStore(), ADDRESS)
    await waitFor(() => {
      expect(result.current.ens).toBe('first.eth')
    })

    rerender({ address: OTHER_ADDRESS })

    expect(result.current.ens).toBeUndefined()
    expect(result.current.resolving).toBe(true)
  })

  it('does not look up a partial address', async () => {
    const { result } = renderResolver(await setupStore(), '0x1234')

    expect(result.current.resolving).toBe(false)
    expect(lookupAddress).not.toHaveBeenCalled()
  })

  it('looks up an address once for many readers', async () => {
    const store = await setupStore()
    const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>

    const { result } = renderHook(() => [useAddressResolver(ADDRESS), useAddressResolver(ADDRESS)], { wrapper })

    await waitFor(() => {
      expect(result.current.map(({ ens }) => ens)).toEqual(['test.eth', 'test.eth'])
    })
    expect(lookupAddress).toHaveBeenCalledTimes(1)
  })

  it('does not reuse a primary name found on the other hub', async () => {
    lookupAddress.mockResolvedValueOnce('mainnet.eth').mockResolvedValueOnce('sepolia.eth')
    const { result, rerender } = renderResolver(await setupStore(), ADDRESS)
    await waitFor(() => {
      expect(result.current.ens).toBe('mainnet.eth')
    })

    currentChain = sepolia
    rerender({ address: ADDRESS })

    await waitFor(() => {
      expect(result.current.ens).toBe('sepolia.eth')
    })
    expect(mockGetProvider).toHaveBeenLastCalledWith(sepolia, undefined)
  })

  it('does not look up a name when the hub has no domain lookup', async () => {
    knownChains = [{ ...mainnet, features: [] }, sepolia, base]

    const { result } = renderResolver(await setupStore(), ADDRESS)

    expect(result.current).toEqual({ name: undefined, ens: undefined, resolving: false })
    expect(lookupAddress).not.toHaveBeenCalled()
  })

  it('looks up again for a new reader after a failed lookup', async () => {
    lookupAddress.mockRejectedValueOnce(new Error('RPC down'))
    const store = await setupStore()
    const first = renderResolver(store, ADDRESS)
    await waitFor(() => {
      expect(first.result.current.resolving).toBe(false)
    })
    expect(first.result.current.ens).toBeUndefined()

    const second = renderResolver(store, ADDRESS)

    await waitFor(() => {
      expect(second.result.current.ens).toBe('test.eth')
    })
    expect(lookupAddress).toHaveBeenCalledTimes(2)
  })
})
