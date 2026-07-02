import { redirectSystemPath } from '../+native-intent'

jest.mock('@/src/services/analytics', () => ({ trackEvent: jest.fn() }))
jest.mock('@/src/services/analytics/events/nativeIntent', () => ({
  createProtectedRouteAttemptEvent: jest.fn(() => ({})),
}))

describe('redirectSystemPath', () => {
  const wcUri = 'wc:abc123@2?relay-protocol=irn&symKey=deadbeef'

  it('swallows the wrapped pairing link (safe://wc?uri=…) without navigating', () => {
    expect(redirectSystemPath({ path: `safe://wc?uri=${encodeURIComponent(wcUri)}`, initial: false })).toBe('')
  })

  it('swallows a request-foregrounding link (safe://wc?requestId=…&sessionTopic=…) without navigating', () => {
    const path = 'safe://wc?requestId=1782477540021154&sessionTopic=823422c89de5a6b18'
    expect(redirectSystemPath({ path, initial: false })).toBe('')
  })

  it('swallows a bare safe://wc link without navigating', () => {
    expect(redirectSystemPath({ path: 'safe://wc', initial: false })).toBe('')
  })

  it('swallows a raw wc: pairing link without navigating', () => {
    expect(redirectSystemPath({ path: 'wc:abc123@2?relay-protocol=irn', initial: true })).toBe('')
  })

  it('swallows the universal-link variant (https://app.safe.global/wc?uri=…) without navigating', () => {
    expect(
      redirectSystemPath({ path: `https://app.safe.global/wc?uri=${encodeURIComponent(wcUri)}`, initial: false }),
    ).toBe('')
  })

  it('swallows a bare scheme foreground redirect (safe://) without navigating', () => {
    expect(redirectSystemPath({ path: 'safe://', initial: false })).toBe('')
    expect(redirectSystemPath({ path: 'safe://?foo=1', initial: false })).toBe('')
  })

  it('does not swallow a real navigation deep link (route lives in the host)', () => {
    const path = 'safe://address-book'
    expect(redirectSystemPath({ path, initial: false })).toBe(path)
  })

  it('does not swallow an unrelated route that merely starts with the letters wc', () => {
    const path = 'safe://wconnect-settings'
    expect(redirectSystemPath({ path, initial: false })).toBe(path)
  })

  it('does not swallow a normal deep link with an unrelated uri param', () => {
    const path = 'safe://contact?uri=https%3A%2F%2Fexample.com'
    expect(redirectSystemPath({ path, initial: false })).toBe(path)
  })

  it('still swallows a WC envelope carrying a non-wc uri (no navigation)', () => {
    // extractWcUri validates the pairing URI downstream; safe://wc?… never routes here.
    expect(redirectSystemPath({ path: 'safe://wc?uri=https://evil', initial: false })).toBe('')
  })

  it('redirects protected routes to home', () => {
    expect(redirectSystemPath({ path: '/sign-transaction', initial: false })).toBe('/')
  })

  it('passes through a regular route unchanged', () => {
    expect(redirectSystemPath({ path: '/address-book', initial: false })).toBe('/address-book')
  })
})
