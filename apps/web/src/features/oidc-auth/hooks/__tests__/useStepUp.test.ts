import { renderHook, act } from '@testing-library/react'
import { GATEWAY_URL } from '@/config/gateway'
import { useStepUp } from '../useStepUp'
import { OIDC_AUTH_PENDING_KEY, STEP_UP_PENDING_KEY } from '../../constants'

describe('useStepUp', () => {
  const originalLocation = window.location

  const setLocation = (href: string) => {
    Object.defineProperty(window, 'location', { writable: true, value: { ...originalLocation, href } })
  }

  beforeEach(() => {
    sessionStorage.clear()
    setLocation('https://app.safe.global/spaces/members?spaceId=42')
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { writable: true, value: originalLocation })
  })

  it('should redirect to the CGW authorize endpoint with elevate=true', () => {
    const { result } = renderHook(() => useStepUp())

    act(() => {
      result.current.stepUpWithRedirect()
    })

    const url = new URL(window.location.href)
    expect(url.origin + url.pathname).toBe(`${GATEWAY_URL}/v1/auth/oidc/authorize`)
    expect(url.searchParams.get('elevate')).toBe('true')
  })

  it('should return to the current page', () => {
    const { result } = renderHook(() => useStepUp())

    act(() => {
      result.current.stepUpWithRedirect()
    })

    expect(new URL(window.location.href).searchParams.get('redirect_url')).toBe(
      'https://app.safe.global/spaces/members?spaceId=42',
    )
  })

  it('should use an explicit redirect URL when provided', () => {
    const { result } = renderHook(() => useStepUp())

    act(() => {
      result.current.stepUpWithRedirect('https://app.safe.global/spaces/settings?spaceId=7')
    })

    expect(new URL(window.location.href).searchParams.get('redirect_url')).toBe(
      'https://app.safe.global/spaces/settings?spaceId=7',
    )
  })

  // Otherwise the return leg would read a previous attempt's error and report a
  // failure that did not happen this time round.
  it('should strip stale error params from the return URL', () => {
    setLocation('https://app.safe.global/spaces/members?spaceId=42&error=access_denied&error_description=nope')
    const { result } = renderHook(() => useStepUp())

    act(() => {
      result.current.stepUpWithRedirect()
    })

    const returnUrl = new URL(new URL(window.location.href).searchParams.get('redirect_url') ?? '')
    expect(returnUrl.searchParams.has('error')).toBe(false)
    expect(returnUrl.searchParams.has('error_description')).toBe(false)
    expect(returnUrl.searchParams.get('spaceId')).toBe('42')
  })

  it('should mark a step-up as pending without marking a sign-in as pending', () => {
    const { result } = renderHook(() => useStepUp())

    act(() => {
      result.current.stepUpWithRedirect()
    })

    expect(sessionStorage.getItem(STEP_UP_PENDING_KEY)).toBe('1')
    expect(sessionStorage.getItem(OIDC_AUTH_PENDING_KEY)).toBeNull()
  })
})
