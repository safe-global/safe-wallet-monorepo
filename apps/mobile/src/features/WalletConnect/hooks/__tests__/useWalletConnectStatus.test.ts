import { renderHook } from '@/src/tests/test-utils'
import { useWalletConnectStatus } from '../useWalletConnectStatus'

let mockContextValue: { address?: string } | null = null

jest.mock('../../context/WalletConnectContext', () => ({
  useOptionalWalletConnectContext: () => mockContextValue,
}))

const signerAddress = '0x1234567890abcdef1234567890abcdef12345678'

describe('useWalletConnectStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockContextValue = null
  })

  it('returns true when context has matching address', () => {
    mockContextValue = { address: signerAddress }

    const { result } = renderHook(() => useWalletConnectStatus(signerAddress))

    expect(result.current).toBe(true)
  })

  it('returns true when addresses match with different casing', () => {
    mockContextValue = { address: signerAddress.toUpperCase() }

    const { result } = renderHook(() => useWalletConnectStatus(signerAddress))

    expect(result.current).toBe(true)
  })

  it('returns false when context is null (AppKit not initialized)', () => {
    mockContextValue = null

    const { result } = renderHook(() => useWalletConnectStatus(signerAddress))

    expect(result.current).toBe(false)
  })

  it('returns false when address does not match', () => {
    mockContextValue = { address: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef' }

    const { result } = renderHook(() => useWalletConnectStatus(signerAddress))

    expect(result.current).toBe(false)
  })

  it('returns false when address is undefined', () => {
    mockContextValue = { address: undefined }

    const { result } = renderHook(() => useWalletConnectStatus(signerAddress))

    expect(result.current).toBe(false)
  })
})
