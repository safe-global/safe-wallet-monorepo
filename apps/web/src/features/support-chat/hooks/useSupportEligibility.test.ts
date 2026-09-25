import { act, renderHook } from '@testing-library/react'
import type { UserSession } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { useSupportEligibility } from './useSupportEligibility'

let mockSignedIn = true
let mockUser: UserSession | undefined
let mockFetching = false
let mockAuthError = false
let mockEligible = false
let mockSupportError: string | undefined
const mockRetry = jest.fn()
const mockSupportSession = jest.fn()
const mockAuthQuery = jest.fn()

jest.mock('@/store', () => ({ useAppSelector: () => mockSignedIn }))
jest.mock('@/store/authSlice', () => ({ isAuthenticated: jest.fn() }))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/auth', () => ({
  useAuthGetMeV1Query: (...args: unknown[]) => {
    mockAuthQuery(...args)
    return { currentData: mockUser, isFetching: mockFetching, isError: mockAuthError }
  },
}))
jest.mock('./useSupportSession', () => ({
  useSupportSession: (...args: unknown[]) => {
    mockSupportSession(...args)
    return { session: { supportEligible: mockEligible }, error: mockSupportError, retry: mockRetry }
  },
}))

describe('useSupportEligibility', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSignedIn = true
    mockUser = { id: '123', authMethod: 'oidc' }
    mockFetching = false
    mockAuthError = false
    mockEligible = true
    mockSupportError = undefined
  })

  it('uses CGW eligibility with automatic refresh disabled', () => {
    const { result, rerender } = renderHook(() => useSupportEligibility(true))
    expect(result.current).toBe(true)
    expect(mockSupportSession).toHaveBeenLastCalledWith(expect.any(String), true, 'oidc:123', { autoRefresh: false })
    mockEligible = false
    rerender()
    expect(result.current).toBe(false)
  })

  it.each(['signed out', 'SIWE', 'identity error', 'support error'])(
    'does not glow with cached premium state when %s',
    (state) => {
      const { result, rerender } = renderHook(() => useSupportEligibility(true))
      mockSignedIn = state !== 'signed out'
      if (state === 'SIWE') mockUser = { id: '123', authMethod: 'siwe' }
      mockAuthError = state === 'identity error'
      mockSupportError = state === 'support error' ? 'Unavailable' : undefined
      rerender()
      expect(result.current).toBe(false)
    },
  )

  it('disables reads and focus refresh when the entry is hidden', () => {
    const { result } = renderHook(() => useSupportEligibility(false))
    expect(result.current).toBe(false)
    expect(mockAuthQuery).toHaveBeenLastCalledWith(undefined, expect.objectContaining({ skip: true }))
    expect(mockSupportSession).toHaveBeenLastCalledWith(expect.any(String), false, 'oidc:123', { autoRefresh: false })
    act(() => window.dispatchEvent(new Event('focus')))
    expect(mockRetry).not.toHaveBeenCalled()
  })

  it('does not request a refresh when returning focus to the Wallet', () => {
    renderHook(() => useSupportEligibility(true))
    act(() => window.dispatchEvent(new Event('focus')))
    expect(mockRetry).not.toHaveBeenCalled()
    expect(mockAuthQuery).toHaveBeenLastCalledWith(undefined, { skip: false })
  })

  it('keeps the identity stable during an unrelated background auth refresh', () => {
    const { result, rerender } = renderHook(() => useSupportEligibility(true))
    mockFetching = true
    rerender()
    expect(result.current).toBe(true)
    expect(mockSupportSession).toHaveBeenLastCalledWith(expect.any(String), true, 'oidc:123', { autoRefresh: false })
  })

  it('uses the new identity when the signed-in user changes', () => {
    const { rerender } = renderHook(() => useSupportEligibility(true))
    mockUser = { id: '456', authMethod: 'oidc' }
    rerender()
    expect(mockSupportSession).toHaveBeenLastCalledWith(expect.any(String), true, 'oidc:456', { autoRefresh: false })
  })
  it('uses CGW eligibility for SIWE with no automatic refresh', () => {
    mockUser = { id: '123', authMethod: 'siwe', signerAddress: '0xABC' }
    const { result, rerender } = renderHook(() => useSupportEligibility(true))
    expect(result.current).toBe(true)
    expect(mockSupportSession).toHaveBeenLastCalledWith(expect.any(String), true, 'siwe:123:0xabc', {
      autoRefresh: false,
    })
    mockEligible = false
    rerender()
    expect(result.current).toBe(false)
  })
})
