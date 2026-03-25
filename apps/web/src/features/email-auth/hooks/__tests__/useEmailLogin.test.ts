import { renderHook, act } from '@testing-library/react'
import { GATEWAY_URL } from '@/config/gateway'
import { useEmailLogin, EMAIL_AUTH_PENDING_KEY, OidcConnection } from '../useEmailLogin'

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
      result.current.loginWithRedirect(OidcConnection.EMAIL)
    })

    expect(sessionStorage.getItem(EMAIL_AUTH_PENDING_KEY)).toBe('1')
  })

  it('should redirect to CGW authorize endpoint with connection and default redirect_url', () => {
    const { result } = renderHook(() => useEmailLogin())

    act(() => {
      result.current.loginWithRedirect(OidcConnection.EMAIL)
    })

    const redirectUrl = new URL(window.location.href)
    expect(redirectUrl.origin + redirectUrl.pathname).toBe(`${GATEWAY_URL}/v1/auth/oidc/authorize`)
    expect(redirectUrl.searchParams.get('redirect_url')).toBe('https://app.safe.global/welcome/spaces')
    expect(redirectUrl.searchParams.get('connection')).toBe(OidcConnection.EMAIL)
  })

  it('should set connection=google-oauth2 for Google login', () => {
    const { result } = renderHook(() => useEmailLogin())

    act(() => {
      result.current.loginWithRedirect(OidcConnection.GOOGLE)
    })

    const redirectUrl = new URL(window.location.href)
    expect(redirectUrl.searchParams.get('connection')).toBe(OidcConnection.GOOGLE)
  })

  it('should use explicit redirect_url when provided', () => {
    const customUrl = 'https://app.safe.global/home'
    const { result } = renderHook(() => useEmailLogin())

    act(() => {
      result.current.loginWithRedirect(OidcConnection.EMAIL, customUrl)
    })

    const redirectUrl = new URL(window.location.href)
    expect(redirectUrl.searchParams.get('redirect_url')).toBe(customUrl)
  })
})
