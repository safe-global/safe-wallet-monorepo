import { renderHook, waitFor } from '@testing-library/react'
import useNameResolver, { getEnsNotAvailableError } from './useNameResolver'
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
const baseChain = chainBuilder().with({ chainId: '8453', shortName: 'base', isTestnet: false, features: [] }).build()

describe('useNameResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCurrentChain.mockReturnValue(currentChain)
    mockUseChain.mockImplementation((chainId: string) => (chainId === '1' ? mainnetChain : undefined))
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

  it('reports a chain-specific error when the name does not resolve', async () => {
    mockResolveNameForChain.mockResolvedValueOnce(undefined as unknown as string)

    const { result } = renderHook(() => useNameResolver('vitalik.eth'))

    await waitFor(() => {
      expect(result.current.resolverError?.message).toBe(getEnsNotAvailableError(currentChain))
    })
    expect(result.current.address).toBeUndefined()
  })

  it('tears down the dedicated hub provider on unmount', async () => {
    const { unmount } = renderHook(() => useNameResolver('vitalik.eth', mainnetChain))

    await waitFor(() => expect(mockCreateWeb3ReadOnly).toHaveBeenCalled())

    unmount()

    expect(dedicatedProvider.destroy).toHaveBeenCalled()
  })
})
