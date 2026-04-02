import { renderHook } from '@/src/tests/test-utils'
import { useWalletConnectStatus } from '../useWalletConnectStatus'

const mockUseProvider = jest.fn()
const mockUseAccount = jest.fn()

jest.mock('@reown/appkit-react-native', () => ({
  useProvider: () => mockUseProvider(),
  useAccount: () => mockUseAccount(),
}))

const signerAddress = '0x1234567890abcdef1234567890abcdef12345678'

describe('useWalletConnectStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns true when provider exists, is connected, and address matches', () => {
    mockUseProvider.mockReturnValue({ provider: {} })
    mockUseAccount.mockReturnValue({
      address: signerAddress,
      isConnected: true,
    })

    const { result } = renderHook(() => useWalletConnectStatus(signerAddress))

    expect(result.current).toBe(true)
  })

  it('returns true when addresses match with different casing', () => {
    mockUseProvider.mockReturnValue({ provider: {} })
    mockUseAccount.mockReturnValue({
      address: signerAddress.toUpperCase(),
      isConnected: true,
    })

    const { result } = renderHook(() => useWalletConnectStatus(signerAddress))

    expect(result.current).toBe(true)
  })

  it('returns false when no provider', () => {
    mockUseProvider.mockReturnValue({ provider: null })
    mockUseAccount.mockReturnValue({
      address: signerAddress,
      isConnected: true,
    })

    const { result } = renderHook(() => useWalletConnectStatus(signerAddress))

    expect(result.current).toBe(false)
  })

  it('returns false when not connected', () => {
    mockUseProvider.mockReturnValue({ provider: {} })
    mockUseAccount.mockReturnValue({
      address: signerAddress,
      isConnected: false,
    })

    const { result } = renderHook(() => useWalletConnectStatus(signerAddress))

    expect(result.current).toBe(false)
  })

  it('returns false when address does not match', () => {
    mockUseProvider.mockReturnValue({ provider: {} })
    mockUseAccount.mockReturnValue({
      address: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      isConnected: true,
    })

    const { result } = renderHook(() => useWalletConnectStatus(signerAddress))

    expect(result.current).toBe(false)
  })

  it('returns false when address is undefined', () => {
    mockUseProvider.mockReturnValue({ provider: {} })
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: true,
    })

    const { result } = renderHook(() => useWalletConnectStatus(signerAddress))

    expect(result.current).toBe(false)
  })
})
