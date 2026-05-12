import { getSafeRedirectTarget } from '../getSafeRedirectTarget'

describe('getSafeRedirectTarget', () => {
  it('accepts absolute same-origin paths', () => {
    expect(getSafeRedirectTarget('/home')).toBe('/home')
    expect(getSafeRedirectTarget('/home?spaceId=42&safe=eth:0xabc')).toBe('/home?spaceId=42&safe=eth:0xabc')
    expect(getSafeRedirectTarget('/spaces/settings#section')).toBe('/spaces/settings#section')
  })

  it('rejects protocol-relative URLs', () => {
    expect(getSafeRedirectTarget('//evil.com')).toBeNull()
    expect(getSafeRedirectTarget('//evil.com/path')).toBeNull()
  })

  it('rejects absolute URLs to external hosts', () => {
    expect(getSafeRedirectTarget('http://evil.com')).toBeNull()
    expect(getSafeRedirectTarget('https://evil.com/path')).toBeNull()
    expect(getSafeRedirectTarget('javascript:alert(1)')).toBeNull()
  })

  it('rejects relative paths that do not start with /', () => {
    expect(getSafeRedirectTarget('home')).toBeNull()
    expect(getSafeRedirectTarget('../etc/passwd')).toBeNull()
  })

  it('keeps URL-encoded slashes inside the pathname (no origin escape)', () => {
    // After URL parsing, %2f stays inside pathname — does not flip the origin.
    // Same-origin same-path; just a quirky path string.
    expect(getSafeRedirectTarget('/%2fevil.com')).toBe('/%2fevil.com')
  })

  it('rejects non-string and empty values', () => {
    expect(getSafeRedirectTarget('')).toBeNull()
    expect(getSafeRedirectTarget(undefined)).toBeNull()
    expect(getSafeRedirectTarget(null)).toBeNull()
    expect(getSafeRedirectTarget(['/home'])).toBeNull()
    expect(getSafeRedirectTarget(42)).toBeNull()
  })
})
