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

  it('should redirect to the CGW authorize endpoint with elevate=true', () => {
    startStepUp()

    const url = new URL(window.location.href)
    expect(url.origin + url.pathname).toBe(`${GATEWAY_URL}/v1/auth/oidc/authorize`)
    expect(url.searchParams.get('elevate')).toBe('true')
  })

  it('should return to the current page', () => {
    startStepUp()

    expect(new URL(window.location.href).searchParams.get('redirect_url')).toBe(
      'https://app.safe.global/spaces/members?spaceId=42',
    )
  })

  it('should use an explicit redirect URL when provided', () => {
    startStepUp('https://app.safe.global/spaces/settings?spaceId=7')

    expect(new URL(window.location.href).searchParams.get('redirect_url')).toBe(
      'https://app.safe.global/spaces/settings?spaceId=7',
    )
  })

  // Otherwise the return leg would read a previous attempt's error and report a
  // failure that did not happen this time round.
  it('should strip stale error params from the return URL', () => {
    setLocation('https://app.safe.global/spaces/members?spaceId=42&error=access_denied&error_description=nope')

    startStepUp()

    const returnUrl = new URL(new URL(window.location.href).searchParams.get('redirect_url') ?? '')
    expect(returnUrl.searchParams.has('error')).toBe(false)
    expect(returnUrl.searchParams.has('error_description')).toBe(false)
    expect(returnUrl.searchParams.get('spaceId')).toBe('42')
  })

  // Regression: a persistent marker here wedged the tab — backing out of the
  // challenge page left it set, and every later attempt refused to navigate.
  // Nothing that outlives the page load may gate a redirect. The sign-in flow's
  // own marker must stay untouched, so a step-up is never read as a login.
  it('should write nothing to sessionStorage', () => {
    startStepUp()

    expect(sessionStorage.length).toBe(0)
    expect(sessionStorage.getItem(OIDC_AUTH_PENDING_KEY)).toBeNull()
  })

  it('should redirect again after an abandoned attempt left residue behind', () => {
    sessionStorage.setItem('oidc_step_up', JSON.stringify({ endpoint: 'spacesDeleteV1', createdAt: Date.now() }))

    expect(startStepUp()).toBe(true)
    expect(new URL(window.location.href).searchParams.get('elevate')).toBe('true')
  })

  // A replayed action that is itself rejected must surface as an error rather
  // than bouncing the user back out to the provider indefinitely.
  it('should not redirect while a return is being processed', () => {
    markStepUpReturnHandled()

    expect(startStepUp()).toBe(false)
    expect(window.location.href).toBe('https://app.safe.global/spaces/members?spaceId=42')
  })

  // Regression: the guard once outlived the return processing, so the SECOND
  // gated action of a session failed with an inline error and no redirect.
  it('should redirect again once the return has been processed', () => {
    markStepUpReturnHandled()
    resetStepUpReturnGuard()

    expect(startStepUp()).toBe(true)
    expect(new URL(window.location.href).searchParams.get('elevate')).toBe('true')
  })
})
