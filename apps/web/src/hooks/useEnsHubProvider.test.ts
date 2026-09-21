import { renderHook } from '@testing-library/react'
import { useEnsHubProvider, _clearEnsHubProviders } from './useEnsHubProvider'
import { chainBuilder } from '@/tests/builders/chains'
import { FEATURES } from '@safe-global/store/gateway/types'

const globalProvider = { id: 'global' }
const sharedProvider = { id: 'shared' }

const mockCreateWeb3ReadOnly = jest.fn<typeof sharedProvider | undefined, unknown[]>(() => sharedProvider)
const mockUseCurrentChain = jest.fn()
const mockUseChain = jest.fn()
const mockUseAppSelector = jest.fn()

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
  useAppSelector: () => mockUseAppSelector(),
}))

const mainnetChain = chainBuilder()
  .with({ chainId: '1', shortName: 'eth', isTestnet: false, features: [FEATURES.DOMAIN_LOOKUP] })
  .build()
const sepoliaChain = chainBuilder()
  .with({ chainId: '11155111', shortName: 'sep', isTestnet: true, features: [] })
  .build()
const baseChain = chainBuilder().with({ chainId: '8453', shortName: 'base', isTestnet: false, features: [] }).build()

describe('useEnsHubProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    _clearEnsHubProviders()
    mockUseCurrentChain.mockReturnValue(baseChain)
    mockUseChain.mockImplementation((chainId: string) => {
      if (chainId === '1') return mainnetChain
      if (chainId === '11155111') return sepoliaChain
      return undefined
    })
    mockUseAppSelector.mockReturnValue(undefined)
  })

  it('selects the mainnet hub for production chains and Sepolia for testnets', () => {
    const production = renderHook(() => useEnsHubProvider(baseChain))
    expect(production.result.current.hubChain).toBe(mainnetChain)

    const testnet = renderHook(() => useEnsHubProvider(sepoliaChain))
    expect(testnet.result.current.hubChain).toBe(sepoliaChain)
  })

  it('reuses the global provider when the current chain is the hub', () => {
    mockUseCurrentChain.mockReturnValue(mainnetChain)

    const { result } = renderHook(() => useEnsHubProvider(mainnetChain))

    expect(result.current.provider).toBe(globalProvider)
    expect(mockCreateWeb3ReadOnly).not.toHaveBeenCalled()
  })

  it('shares one hub provider across hook instances', () => {
    const first = renderHook(() => useEnsHubProvider(baseChain))
    const second = renderHook(() => useEnsHubProvider(baseChain))

    expect(first.result.current.provider).toBe(sharedProvider)
    expect(second.result.current.provider).toBe(sharedProvider)
    expect(mockCreateWeb3ReadOnly).toHaveBeenCalledTimes(1)
    expect(mockCreateWeb3ReadOnly).toHaveBeenCalledWith(mainnetChain, undefined)
  })

  it('creates a separate provider when a custom RPC is configured for the hub', () => {
    mockUseAppSelector.mockReturnValue({ '1': 'https://custom.example' })

    const { result } = renderHook(() => useEnsHubProvider(baseChain))

    expect(result.current.provider).toBe(sharedProvider)
    expect(mockCreateWeb3ReadOnly).toHaveBeenCalledWith(mainnetChain, 'https://custom.example')
  })

  it('fails closed when the hub chain is not in the loaded config', () => {
    mockUseChain.mockReturnValue(undefined)

    const { result } = renderHook(() => useEnsHubProvider(baseChain))

    expect(result.current.hubChain).toBeUndefined()
    expect(result.current.provider).toBeUndefined()
    expect(mockCreateWeb3ReadOnly).not.toHaveBeenCalled()
  })

  it('gates domain lookup on the hub chain feature flag only', () => {
    // Mainnet hub has DOMAIN_LOOKUP, Sepolia hub (for testnets) does not
    const production = renderHook(() => useEnsHubProvider(baseChain))
    expect(production.result.current.isDomainLookupEnabled).toBe(true)

    const testnet = renderHook(() => useEnsHubProvider(sepoliaChain))
    expect(testnet.result.current.isDomainLookupEnabled).toBe(false)
  })

  it('ignores DOMAIN_LOOKUP on the target L2 chain', () => {
    const baseWithFlag = chainBuilder()
      .with({ chainId: '8453', shortName: 'base', isTestnet: false, features: [FEATURES.DOMAIN_LOOKUP] })
      .build()
    // Hub (mainnet) lacks the flag — L2 having it must not enable ENS
    mockUseChain.mockImplementation((chainId: string) => {
      if (chainId === '1') return { ...mainnetChain, features: [] }
      return undefined
    })

    const { result } = renderHook(() => useEnsHubProvider(baseWithFlag))

    expect(result.current.hubChain?.chainId).toBe('1')
    expect(result.current.isDomainLookupEnabled).toBe(false)
  })

  it('returns no provider without a target chain', () => {
    const { result } = renderHook(() => useEnsHubProvider(undefined))

    expect(result.current.hubChain).toBeUndefined()
    expect(result.current.provider).toBeUndefined()
  })

  it('does not cache a failed provider creation', () => {
    mockCreateWeb3ReadOnly.mockReturnValueOnce(undefined)

    const failed = renderHook(() => useEnsHubProvider(baseChain))
    expect(failed.result.current.provider).toBeUndefined()

    const retried = renderHook(() => useEnsHubProvider(baseChain))
    expect(retried.result.current.provider).toBe(sharedProvider)
  })
})
