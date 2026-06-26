import { renderHook, waitFor } from '@testing-library/react'
import useNameResolver, { getEnsNotAvailableError } from './useNameResolver'
import { chainBuilder } from '@/tests/builders/chains'
import { FEATURES } from '@safe-global/store/gateway/types'

const globalProvider = { id: 'global' }
const dedicatedProvider = { id: 'dedicated', destroy: jest.fn() }

const mockCreateWeb3ReadOnly = jest.fn<typeof dedicatedProvider, unknown[]>(() => dedicatedProvider)
const mockResolveName = jest.fn<Promise<string>, unknown[]>(() =>
  Promise.resolve('0x1234567890123456789012345678901234567890'),
)
const mockUseCurrentChain = jest.fn()

jest.mock('@/hooks/wallets/web3ReadOnly', () => ({
  useWeb3ReadOnly: () => globalProvider,
}))

jest.mock('@/hooks/wallets/web3', () => ({
  createWeb3ReadOnly: (...args: unknown[]) => mockCreateWeb3ReadOnly(...args),
}))

jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: () => mockUseCurrentChain(),
}))

jest.mock('@/store', () => ({
  useAppSelector: () => undefined,
}))

jest.mock('@/services/ens', () => ({
  isDomain: (value: string) => value.includes('.'),
  resolveName: (...args: unknown[]) => mockResolveName(...args),
}))

const currentChain = chainBuilder().with({ chainId: '100', features: [] }).build()
const mainnetChain = chainBuilder()
  .with({ chainId: '1', shortName: 'eth', features: [FEATURES.DOMAIN_LOOKUP] })
  .build()

describe('useNameResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCurrentChain.mockReturnValue(currentChain)
  })

  it('resolves via the global provider when no chain is given', async () => {
    const { result } = renderHook(() => useNameResolver('vitalik.eth'))

    await waitFor(() => {
      expect(result.current.address).toBe('0x1234567890123456789012345678901234567890')
    })

    expect(result.current.name).toBe('vitalik.eth')
    expect(mockResolveName).toHaveBeenCalledWith(globalProvider, 'vitalik.eth')
    expect(mockCreateWeb3ReadOnly).not.toHaveBeenCalled()
  })

  it('resolves via the global provider when the given chain matches the current chain', async () => {
    mockUseCurrentChain.mockReturnValue(mainnetChain)

    const { result } = renderHook(() => useNameResolver('vitalik.eth', mainnetChain))

    await waitFor(() => {
      expect(result.current.address).toBe('0x1234567890123456789012345678901234567890')
    })

    expect(mockResolveName).toHaveBeenCalledWith(globalProvider, 'vitalik.eth')
    expect(mockCreateWeb3ReadOnly).not.toHaveBeenCalled()
  })

  it('creates a dedicated provider for the given chain when it differs from the current chain', async () => {
    const { result } = renderHook(() => useNameResolver('vitalik.eth', mainnetChain))

    await waitFor(() => {
      expect(result.current.address).toBe('0x1234567890123456789012345678901234567890')
    })

    expect(mockCreateWeb3ReadOnly).toHaveBeenCalledWith(mainnetChain, undefined)
    expect(mockResolveName).toHaveBeenCalledWith(dedicatedProvider, 'vitalik.eth')
  })

  it('reports a chain-specific error when the name does not resolve', async () => {
    mockResolveName.mockResolvedValueOnce(undefined as unknown as string)

    const { result } = renderHook(() => useNameResolver('vitalik.eth'))

    await waitFor(() => {
      expect(result.current.resolverError?.message).toBe(getEnsNotAvailableError(currentChain))
    })
    expect(result.current.address).toBeUndefined()
  })

  it('tears down the dedicated provider on unmount', async () => {
    const { unmount } = renderHook(() => useNameResolver('vitalik.eth', mainnetChain))

    await waitFor(() => expect(mockCreateWeb3ReadOnly).toHaveBeenCalled())

    unmount()

    expect(dedicatedProvider.destroy).toHaveBeenCalled()
  })
})
