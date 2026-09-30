import { renderHook, waitFor } from '@testing-library/react'
import useNameResolver, { getEnsNotAvailableError } from './useNameResolver'
import { _clearEnsHubProviders } from '@/hooks/useEnsHubProvider'
import { chainBuilder } from '@/tests/builders/chains'
import { FEATURES } from '@safe-global/store/gateway/types'

const globalProvider = { id: 'global' }
const dedicatedProvider = { id: 'dedicated', destroy: jest.fn() }

const mockCreateWeb3ReadOnly = jest.fn<typeof dedicatedProvider, unknown[]>(() => dedicatedProvider)
const mockResolveNameForChain = jest.fn<Promise<string>, unknown[]>(() =>
  Promise.resolve('0x1234567890123456789012345678901234567890'),
)
const mockUseCurrentChain = jest.fn()
const mockUseChain = jest.fn()

jest.mock('@/hooks/wallets/web3ReadOnly', () => ({
  useWeb3ReadOnly: () => globalProvider,
}))

jest.mock('@/hooks/wallets/web3', () => ({
  createWeb3ReadOnly: (...args: unknown[]) => mockCreateWeb3ReadOnly(...args),
}))

jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: () => mockUseCurrentChain(),
  useChain: (chainId: string) => mockUseChain(chainId),
}))

jest.mock('@/store', () => ({
  useAppSelector: () => undefined,
}))

jest.mock('@/services/ens', () => ({
  isDomain: (value: string) => value.includes('.'),
  resolveNameForChain: (...args: unknown[]) => mockResolveNameForChain(...args),
}))

const currentChain = chainBuilder().with({ chainId: '100', isTestnet: false, features: [] }).build()
const mainnetChain = chainBuilder()
  .with({ chainId: '1', shortName: 'eth', isTestnet: false, features: [FEATURES.DOMAIN_LOOKUP] })
  .build()
const sepoliaChain = chainBuilder()
  .with({ chainId: '11155111', shortName: 'sep', isTestnet: true, features: [FEATURES.DOMAIN_LOOKUP] })
  .build()
const baseChain = chainBuilder().with({ chainId: '8453', shortName: 'base', isTestnet: false, features: [] }).build()

describe('useNameResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    _clearEnsHubProviders()
    mockUseCurrentChain.mockReturnValue(currentChain)
    mockUseChain.mockImplementation((chainId: string) => {
      if (chainId === '1') return mainnetChain
      if (chainId === '11155111') return sepoliaChain
      return undefined
    })
  })

  it('resolves via a dedicated mainnet hub provider when the current chain is not the hub', async () => {
    const { result } = renderHook(() => useNameResolver('vitalik.eth'))

    await waitFor(() => {
      expect(result.current.address).toBe('0x1234567890123456789012345678901234567890')
    })

    expect(result.current.name).toBe('vitalik.eth')
    expect(mockCreateWeb3ReadOnly).toHaveBeenCalledWith(mainnetChain, undefined)
    expect(mockResolveNameForChain).toHaveBeenCalledWith(dedicatedProvider, 'vitalik.eth', 100)
  })

  it('resolves via the global provider when the current chain is the hub', async () => {
    mockUseCurrentChain.mockReturnValue(mainnetChain)

    const { result } = renderHook(() => useNameResolver('vitalik.eth', mainnetChain))

    await waitFor(() => {
      expect(result.current.address).toBe('0x1234567890123456789012345678901234567890')
    })

    expect(mockResolveNameForChain).toHaveBeenCalledWith(globalProvider, 'vitalik.eth', 1)
    expect(mockCreateWeb3ReadOnly).not.toHaveBeenCalled()
  })

  it('uses the given chain as the coinType target while still resolving on the hub', async () => {
    const { result } = renderHook(() => useNameResolver('vitalik.eth', baseChain))

    await waitFor(() => {
      expect(result.current.address).toBe('0x1234567890123456789012345678901234567890')
    })

    expect(mockCreateWeb3ReadOnly).toHaveBeenCalledWith(mainnetChain, undefined)
    expect(mockResolveNameForChain).toHaveBeenCalledWith(dedicatedProvider, 'vitalik.eth', 8453)
  })

  it('resolves Sepolia targets on the Sepolia hub with chain id 11155111 (coin type 60)', async () => {
    mockUseCurrentChain.mockReturnValue(sepoliaChain)

    const { result } = renderHook(() => useNameResolver('vitalik.eth', sepoliaChain))

    await waitFor(() => {
      expect(result.current.address).toBe('0x1234567890123456789012345678901234567890')
    })

    expect(mockResolveNameForChain).toHaveBeenCalledWith(globalProvider, 'vitalik.eth', 11155111)
    expect(mockCreateWeb3ReadOnly).not.toHaveBeenCalled()
  })

  it('uses mainnet coin type when an explicit mainnet chain is passed on an L2 Safe', async () => {
    mockUseCurrentChain.mockReturnValue(baseChain)

    const { result } = renderHook(() => useNameResolver('vitalik.eth', mainnetChain))

    await waitFor(() => {
      expect(result.current.address).toBe('0x1234567890123456789012345678901234567890')
    })

    // Spaces invites pass mainnet so they stay on coin type 60 even when viewing an L2 Safe
    expect(mockResolveNameForChain).toHaveBeenCalledWith(dedicatedProvider, 'vitalik.eth', 1)
  })

  it('reports a chain-specific error when the name does not resolve', async () => {
    mockResolveNameForChain.mockResolvedValueOnce(undefined as unknown as string)

    const { result } = renderHook(() => useNameResolver('vitalik.eth'))

    await waitFor(() => {
      expect(result.current.resolverError?.message).toBe(getEnsNotAvailableError(currentChain))
    })
    expect(result.current.address).toBeUndefined()
  })

  it('reuses one shared hub provider across hook instances', async () => {
    const first = renderHook(() => useNameResolver('vitalik.eth'))
    await waitFor(() => expect(first.result.current.address).toBeDefined())

    const second = renderHook(() => useNameResolver('safe.eth'))
    await waitFor(() => expect(second.result.current.address).toBeDefined())

    expect(mockCreateWeb3ReadOnly).toHaveBeenCalledTimes(1)
    expect(dedicatedProvider.destroy).not.toHaveBeenCalled()
  })

  it('does not resolve when the hub chain is not in the loaded config', async () => {
    mockUseChain.mockReturnValue(undefined)

    const { result } = renderHook(() => useNameResolver('vitalik.eth'))

    // Debounce window plus a tick — resolution must never start without a hub provider
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(mockResolveNameForChain).not.toHaveBeenCalled()
    expect(mockCreateWeb3ReadOnly).not.toHaveBeenCalled()
    expect(result.current.address).toBeUndefined()
    expect(result.current.resolving).toBe(false)
  })
})
