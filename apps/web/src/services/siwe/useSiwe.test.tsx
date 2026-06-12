import { renderHook, act } from '@testing-library/react'
import { useSiwe } from './useSiwe'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'

const mockFetchNonce = jest.fn()
const mockVerify = jest.fn()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/auth', () => ({
  useLazyAuthGetNonceV1Query: () => [mockFetchNonce],
  useAuthVerifyV1Mutation: () => [mockVerify],
}))

const mockUseWeb3 = jest.fn()
jest.mock('@/hooks/wallets/web3ReadOnly', () => ({
  useWeb3: () => mockUseWeb3(),
}))

const mockUseWallet = jest.fn()
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockUseWallet(),
}))

const mockCreateWeb3 = jest.fn()
jest.mock('@/hooks/wallets/web3', () => ({
  createWeb3: (provider: unknown) => mockCreateWeb3(provider),
}))

describe('useSiwe', () => {
  const walletProvider = { request: jest.fn() }
  const wallet = { label: 'MetaMask', provider: walletProvider } as unknown as ConnectedWallet

  const buildProvider = () => {
    const signer = {
      address: '0x0000000000000000000000000000000000000abc',
      signMessage: jest.fn().mockResolvedValue('0xsig'),
    }
    return {
      getNetwork: jest.fn().mockResolvedValue({ chainId: 1n }),
      getSigner: jest.fn().mockResolvedValue(signer),
      send: jest.fn(),
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchNonce.mockResolvedValue({ data: { nonce: 'nonce-123' } })
    mockVerify.mockReturnValue({ data: true })
    mockUseWallet.mockReturnValue(wallet)
  })

  it('signs in using the chain-matched provider when available', async () => {
    const provider = buildProvider()
    mockUseWeb3.mockReturnValue(provider)

    const { result } = renderHook(() => useSiwe())
    await act(async () => {
      await result.current.signIn()
    })

    expect(mockCreateWeb3).not.toHaveBeenCalled()
    expect(provider.getSigner).toHaveBeenCalled()
    expect(mockVerify).toHaveBeenCalledWith(
      expect.objectContaining({ siweDto: expect.objectContaining({ signature: '0xsig' }) }),
    )
  })

  it('builds a provider from the wallet when none is available (wallet on wrong chain)', async () => {
    // useWeb3 is undefined when the wallet is on a chain other than the current one.
    mockUseWeb3.mockReturnValue(undefined)
    const fallbackProvider = buildProvider()
    mockCreateWeb3.mockReturnValue(fallbackProvider)

    const { result } = renderHook(() => useSiwe())
    await act(async () => {
      await result.current.signIn()
    })

    expect(mockCreateWeb3).toHaveBeenCalledWith(walletProvider)
    expect(fallbackProvider.getSigner).toHaveBeenCalled()
    expect(mockVerify).toHaveBeenCalledWith(
      expect.objectContaining({ siweDto: expect.objectContaining({ signature: '0xsig' }) }),
    )
  })

  it('does nothing when no wallet is connected', async () => {
    mockUseWallet.mockReturnValue(null)
    mockUseWeb3.mockReturnValue(undefined)

    const { result } = renderHook(() => useSiwe())
    await act(async () => {
      await result.current.signIn()
    })

    expect(mockCreateWeb3).not.toHaveBeenCalled()
    expect(mockVerify).not.toHaveBeenCalled()
  })
})
