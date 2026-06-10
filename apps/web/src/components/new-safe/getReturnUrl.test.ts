import { AppRoutes } from '@/config/routes'
import { getNewSafeReturnUrl } from './getReturnUrl'

describe('getNewSafeReturnUrl', () => {
  it('returns the parsed return URL when a valid `next` is provided', () => {
    expect(getNewSafeReturnUrl('/spaces')).toEqual({ pathname: '/spaces', query: {} })
  })

  it('preserves query params from the `next` value (e.g. spaceId)', () => {
    expect(getNewSafeReturnUrl('/spaces?spaceId=123')).toEqual({
      pathname: '/spaces',
      query: { spaceId: '123' },
    })
  })

  it('falls back to the Spaces overview when `next` is missing', () => {
    expect(getNewSafeReturnUrl(undefined)).toBe(AppRoutes.welcome.spaces)
  })

  it('falls back to the Spaces overview when `next` is an empty string', () => {
    expect(getNewSafeReturnUrl('')).toBe(AppRoutes.welcome.spaces)
  })

  it('falls back when `next` is an open-redirect (protocol-relative URL)', () => {
    expect(getNewSafeReturnUrl('//evil.com')).toBe(AppRoutes.welcome.spaces)
  })

  it('falls back when `next` is an absolute URL', () => {
    expect(getNewSafeReturnUrl('https://evil.com')).toBe(AppRoutes.welcome.spaces)
  })

  it('falls back when `next` is a self-redirecting path', () => {
    expect(getNewSafeReturnUrl('/welcome')).toBe(AppRoutes.welcome.spaces)
    expect(getNewSafeReturnUrl(AppRoutes.welcome.spaces)).toBe(AppRoutes.welcome.spaces)
  })

  it('falls back when `next` is not a string (e.g. a query-param array)', () => {
    expect(getNewSafeReturnUrl(['/spaces', '/welcome'])).toBe(AppRoutes.welcome.spaces)
  })
})
