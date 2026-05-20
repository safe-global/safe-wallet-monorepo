import { buildCurrentNextUrl, sanitizeNextUrl } from '../nextUrl'

describe('sanitizeNextUrl', () => {
  it('returns the path when it is a same-origin relative URL', () => {
    expect(sanitizeNextUrl('/foo')).toBe('/foo')
    expect(sanitizeNextUrl('/spaces?spaceId=1')).toBe('/spaces?spaceId=1')
  })

  it('rejects protocol-relative URLs', () => {
    expect(sanitizeNextUrl('//evil.com/x')).toBeNull()
    expect(sanitizeNextUrl('/\\evil.com/x')).toBeNull()
  })

  it('rejects absolute URLs', () => {
    expect(sanitizeNextUrl('https://evil.com/x')).toBeNull()
    expect(sanitizeNextUrl('http://evil.com')).toBeNull()
  })

  it('rejects non-string values', () => {
    expect(sanitizeNextUrl(undefined)).toBeNull()
    expect(sanitizeNextUrl(null)).toBeNull()
    expect(sanitizeNextUrl(123)).toBeNull()
    expect(sanitizeNextUrl(['/foo'])).toBeNull()
  })

  it('rejects empty strings and paths that do not start with /', () => {
    expect(sanitizeNextUrl('')).toBeNull()
    expect(sanitizeNextUrl('foo')).toBeNull()
  })

  it('rejects bare "/" since it just redirects to /welcome/spaces', () => {
    expect(sanitizeNextUrl('/')).toBeNull()
  })
})

describe('buildCurrentNextUrl', () => {
  it('returns pathname when there is no query', () => {
    expect(buildCurrentNextUrl('/foo', {})).toBe('/foo')
  })

  it('serialises string query params', () => {
    expect(buildCurrentNextUrl('/foo', { a: '1', b: '2' })).toBe('/foo?a=1&b=2')
  })

  it('drops a pre-existing next param so it is not nested into itself', () => {
    expect(buildCurrentNextUrl('/foo', { next: '/bar', a: '1' })).toBe('/foo?a=1')
  })

  it('serialises array query params with repeated keys', () => {
    expect(buildCurrentNextUrl('/foo', { tag: ['a', 'b'] })).toBe('/foo?tag=a&tag=b')
  })

  it('ignores undefined query values', () => {
    expect(buildCurrentNextUrl('/foo', { a: '1', b: undefined })).toBe('/foo?a=1')
  })
})
