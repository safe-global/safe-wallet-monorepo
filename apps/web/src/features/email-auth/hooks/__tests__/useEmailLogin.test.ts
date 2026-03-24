import { renderHook, act } from '@testing-library/react'
import { GATEWAY_URL } from '@/config/gateway'
import { useEmailLogin, EMAIL_AUTH_PENDING_KEY } from '../useEmailLogin'

describe('useEmailLogin', () => {
  const originalLocation = window.location

  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()

    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, href: 'https://app.safe.global/welcome/spaces' },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    })
  })

  it('should set sessionStorage flag on loginWithRedirect', () => {
    const { result } = renderHook(() => useEmailLogin())

    act(() => {
      result.current.loginWithRedirect()
    })

    expect(sessionStorage.getItem(EMAIL_AUTH_PENDING_KEY)).toBe('1')
  })

  it('should redirect to CGW authorize endpoint', () => {
    const { result } = renderHook(() => useEmailLogin())

    act(() => {
      result.current.loginWithRedirect()
    })

    expect(window.location.href).toBe(`${GATEWAY_URL}/v1/auth/oidc/authorize`)
  })
})
