import { renderHook } from '@/src/tests/test-utils'
import { useWalletConnectSigning } from '../useWalletConnectSigning'
import { signWithWalletConnect } from '@/src/services/walletconnect/walletconnect-signing.service'
import type { Chain as ChainInfo } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeInfo } from '@/src/types/address'
import { faker } from '@faker-js/faker'
import { act } from '@testing-library/react-native'

const mockProvider = { request: jest.fn() }
const mockUseProvider = jest.fn()

jest.mock('@reown/appkit-react-native', () => ({
  useProvider: () => mockUseProvider(),
}))

jest.mock('@/src/services/walletconnect/walletconnect-signing.service', () => ({
  signWithWalletConnect: jest.fn(),
}))

const mockSignWithWalletConnect = signWithWalletConnect as jest.MockedFunction<typeof signWithWalletConnect>

const baseParams = {
  chain: { chainId: '1' } as ChainInfo,
  activeSafe: { chainId: '1', address: faker.string.hexadecimal({ length: 40 }) } as SafeInfo,
  txId: faker.string.uuid(),
  signerAddress: faker.string.hexadecimal({ length: 40 }),
}

describe('useWalletConnectSigning', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseProvider.mockReturnValue({ provider: mockProvider })
  })

  describe('hasProvider', () => {
    it('returns true when provider is available', () => {
      const { result } = renderHook(() => useWalletConnectSigning())

      expect(result.current.hasProvider).toBe(true)
    })

    it('returns false when provider is null', () => {
      mockUseProvider.mockReturnValue({ provider: null })

      const { result } = renderHook(() => useWalletConnectSigning())

      expect(result.current.hasProvider).toBe(false)
    })
  })

  describe('sign', () => {
    it('throws when provider is not available', async () => {
      mockUseProvider.mockReturnValue({ provider: null })

      const { result } = renderHook(() => useWalletConnectSigning())

      await expect(act(() => result.current.sign({ ...baseParams, safeVersion: '1.3.0' }))).rejects.toThrow(
        'WalletConnect provider not available',
      )
    })

    it('throws when safeVersion is missing', async () => {
      const { result } = renderHook(() => useWalletConnectSigning())

      await expect(act(() => result.current.sign({ ...baseParams }))).rejects.toThrow(
        'Safe version not available for WalletConnect signing',
      )
    })

    it('delegates to signWithWalletConnect with provider and validated params', async () => {
      const mockResponse = {
        signature: '0xsig',
        safeTransactionHash: '0xhash',
      }
      mockSignWithWalletConnect.mockResolvedValue(mockResponse)

      const { result } = renderHook(() => useWalletConnectSigning())

      let response: Awaited<ReturnType<typeof result.current.sign>> | undefined
      await act(async () => {
        response = await result.current.sign({ ...baseParams, safeVersion: '1.3.0' })
      })

      expect(response).toEqual(mockResponse)
      expect(mockSignWithWalletConnect).toHaveBeenCalledWith({
        ...baseParams,
        safeVersion: '1.3.0',
        provider: mockProvider,
      })
    })

    it('propagates errors from signWithWalletConnect', async () => {
      mockSignWithWalletConnect.mockRejectedValue(new Error('Wallet rejected'))

      const { result } = renderHook(() => useWalletConnectSigning())

      await expect(act(() => result.current.sign({ ...baseParams, safeVersion: '1.3.0' }))).rejects.toThrow(
        'Wallet rejected',
      )
    })
  })
})
