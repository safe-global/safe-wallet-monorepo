/**
 * @jest-environment-options {"url": "https://app.safe.global/welcome/spaces"}
 */
import { renderHook, act } from '@testing-library/react'
import { GATEWAY_URL } from '@/config/gateway'
import { navigateTo } from '@/utils/navigation'
import { useOidcLogin } from '../useOidcLogin'
import { OIDC_AUTH_PENDING_KEY, OidcConnection } from '../../constants'

jest.mock('@/utils/navigation')

const redirectedUrl = () => new URL(jest.mocked(navigateTo).mock.lastCall?.[0] ?? '')

describe('useOidcLogin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    sessionStorage.clear()
    window.history.replaceState(null, '', '/welcome/spaces')
  })

  it('should set sessionStorage flag on loginWithRedirect', () => {
    const { result } = renderHook(() => useOidcLogin())

    act(() => {
      result.current.loginWithRedirect(OidcConnection.EMAIL)
    })

    expect(sessionStorage.getItem(OIDC_AUTH_PENDING_KEY)).toBe('1')
  })

  it('should redirect to CGW authorize endpoint with connection and default redirect_url', () => {
    const { result } = renderHook(() => useOidcLogin())

    act(() => {
      result.current.loginWithRedirect(OidcConnection.EMAIL)
    })

    const redirectUrl = redirectedUrl()
    expect(redirectUrl.origin + redirectUrl.pathname).toBe(`${GATEWAY_URL}/v1/auth/oidc/authorize`)
    expect(redirectUrl.searchParams.get('redirect_url')).toBe('https://app.safe.global/welcome/spaces')
    expect(redirectUrl.searchParams.get('connection')).toBe(OidcConnection.EMAIL)
  })

  it('should set connection=google-oauth2 for Google login', () => {
    const { result } = renderHook(() => useOidcLogin())

    act(() => {
      result.current.loginWithRedirect(OidcConnection.GOOGLE)
    })

    const redirectUrl = redirectedUrl()
    expect(redirectUrl.searchParams.get('connection')).toBe(OidcConnection.GOOGLE)
  })

  it('should use explicit redirect_url when provided', () => {
    const customUrl = 'https://app.safe.global/home'
    const { result } = renderHook(() => useOidcLogin())

    act(() => {
      result.current.loginWithRedirect(OidcConnection.EMAIL, customUrl)
    })

    const redirectUrl = redirectedUrl()
    expect(redirectUrl.searchParams.get('redirect_url')).toBe(customUrl)
  })

  it('should strip stale error param from redirect_url', () => {
    window.history.replaceState(null, '', '/welcome/spaces?error=previous_failure&chain=eth')
    const { result } = renderHook(() => useOidcLogin())

    act(() => {
      result.current.loginWithRedirect(OidcConnection.EMAIL)
    })

    const redirectUrl = redirectedUrl()
    const returnUrl = redirectUrl.searchParams.get('redirect_url')!

    expect(returnUrl).not.toContain('error=')
    expect(returnUrl).toContain('chain=eth')
  })
})
