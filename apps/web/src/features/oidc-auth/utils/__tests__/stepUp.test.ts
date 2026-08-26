import { GATEWAY_URL } from '@/config/gateway'
import { markStepUpReturnHandled, resetStepUpReturnGuard, startStepUp } from '../stepUp'
import { OIDC_AUTH_PENDING_KEY } from '../../constants'

describe('startStepUp', () => {
  const originalLocation = window.location

  const setLocation = (href: string) => {
    Object.defineProperty(window, 'location', { writable: true, value: { ...originalLocation, href } })
  }

  beforeEach(() => {
    sessionStorage.clear()
    resetStepUpReturnGuard()
    setLocation('https://app.safe.global/spaces/members?spaceId=42')
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { writable: true, value: originalLocation })
  })

  it('should, when called, redirect to the CGW authorize endpoint with elevate=true', () => {
    startStepUp()

    const url = new URL(window.location.href)
    expect(url.origin + url.pathname).toBe(`${GATEWAY_URL}/v1/auth/oidc/authorize`)
    expect(url.searchParams.get('elevate')).toBe('true')
  })

  it('should, when no redirect URL is given, return to the current page', () => {
    startStepUp()

    expect(new URL(window.location.href).searchParams.get('redirect_url')).toBe(
      'https://app.safe.global/spaces/members?spaceId=42',
    )
  })

  it('should, when a redirect URL is given, return to that URL instead', () => {
    startStepUp('https://app.safe.global/spaces/settings?spaceId=7')

    expect(new URL(window.location.href).searchParams.get('redirect_url')).toBe(
      'https://app.safe.global/spaces/settings?spaceId=7',
    )
  })

  it('should, when the current URL carries stale error params, strip them from the return URL', () => {
    setLocation('https://app.safe.global/spaces/members?spaceId=42&error=access_denied&error_description=nope')

    startStepUp()

    const returnUrl = new URL(new URL(window.location.href).searchParams.get('redirect_url') ?? '')
    expect(returnUrl.searchParams.has('error')).toBe(false)
    expect(returnUrl.searchParams.has('error_description')).toBe(false)
    expect(returnUrl.searchParams.get('spaceId')).toBe('42')
  })

  it('should, when called, write nothing to sessionStorage', () => {
    startStepUp()

    expect(sessionStorage.length).toBe(0)
    expect(sessionStorage.getItem(OIDC_AUTH_PENDING_KEY)).toBeNull()
  })

  it('should, when an abandoned attempt left residue behind, redirect again', () => {
    sessionStorage.setItem('oidc_step_up', JSON.stringify({ endpoint: 'spacesDeleteV1', createdAt: Date.now() }))

    expect(startStepUp()).toBe(true)
    expect(new URL(window.location.href).searchParams.get('elevate')).toBe('true')
  })

  it('should, when a return is being processed, not redirect', () => {
    markStepUpReturnHandled()

    expect(startStepUp()).toBe(false)
    expect(window.location.href).toBe('https://app.safe.global/spaces/members?spaceId=42')
  })

  it('should, when the return has been processed, redirect again', () => {
    markStepUpReturnHandled()
    resetStepUpReturnGuard()

    expect(startStepUp()).toBe(true)
    expect(new URL(window.location.href).searchParams.get('elevate')).toBe('true')
  })
})
