import { buildCurrentNextUrl, parseNextUrlForRouter, parseSpaceReturnUrl, sanitizeNextUrl } from '../nextUrl'

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

  it('rejects /welcome and /welcome/spaces (both self-redirecting)', () => {
    expect(sanitizeNextUrl('/welcome')).toBeNull()
    expect(sanitizeNextUrl('/welcome/spaces')).toBeNull()
    expect(sanitizeNextUrl('/welcome?chain=eth')).toBeNull()
    expect(sanitizeNextUrl('/welcome/spaces#section')).toBeNull()
  })

  it('rejects trailing-slash variants of self-redirecting paths', () => {
    expect(sanitizeNextUrl('/welcome/')).toBeNull()
    expect(sanitizeNextUrl('/welcome/spaces/')).toBeNull()
    expect(sanitizeNextUrl('/welcome/spaces/?chain=eth')).toBeNull()
  })
})

describe('parseNextUrlForRouter', () => {
  it('returns null when sanitizeNextUrl rejects the input', () => {
    expect(parseNextUrlForRouter(undefined)).toBeNull()
    expect(parseNextUrlForRouter('//evil.com')).toBeNull()
    expect(parseNextUrlForRouter('https://evil.com/x')).toBeNull()
    expect(parseNextUrlForRouter('/')).toBeNull()
    expect(parseNextUrlForRouter('/welcome/spaces')).toBeNull()
  })

  it('rejects path-traversal that collapses to a self-redirecting path', () => {
    // new URL('/foo/..', 'http://localhost').pathname === '/'
    expect(parseNextUrlForRouter('/foo/..')).toBeNull()
    // new URL('/welcome/x/..', 'http://localhost').pathname === '/welcome'
    expect(parseNextUrlForRouter('/welcome/x/..')).toBeNull()
    // Trailing-slash variant
    expect(parseNextUrlForRouter('/welcome/spaces/x/../')).toBeNull()
  })

  it('returns pathname and empty query for a plain path', () => {
    expect(parseNextUrlForRouter('/balances')).toEqual({ pathname: '/balances', query: {} })
  })

  it('parses query parameters into an object', () => {
    expect(parseNextUrlForRouter('/balances?safe=eth%3A0xabc&chain=eth')).toEqual({
      pathname: '/balances',
      query: { safe: 'eth:0xabc', chain: 'eth' },
    })
  })

  it('preserves a hash fragment when present', () => {
    expect(parseNextUrlForRouter('/balances?safe=eth%3A0xabc#tokens')).toEqual({
      pathname: '/balances',
      query: { safe: 'eth:0xabc' },
      hash: '#tokens',
    })
  })

  it('collects repeated query keys into an array', () => {
    expect(parseNextUrlForRouter('/transactions?tag=a&tag=b&tag=c')).toEqual({
      pathname: '/transactions',
      query: { tag: ['a', 'b', 'c'] },
    })
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

describe('parseSpaceReturnUrl', () => {
  const spaceId = '11111111-1111-1111-1111-111111111111'

  it('returns a Workspace page of the given Workspace with its query', () => {
    expect(parseSpaceReturnUrl(`/spaces/transactions?spaceId=${spaceId}&tab=history`, spaceId)).toEqual({
      pathname: '/spaces/transactions',
      query: { spaceId, tab: 'history' },
    })
    expect(parseSpaceReturnUrl(`/spaces?spaceId=${spaceId}`, spaceId)).toEqual({
      pathname: '/spaces',
      query: { spaceId },
    })
  })

  it.each([
    ['an absolute URL', `https://evil.com/spaces?spaceId=${spaceId}`],
    ['a protocol-relative URL', `//evil.com/spaces?spaceId=${spaceId}`],
    ['a backslash URL', `/\\evil.com/spaces?spaceId=${spaceId}`],
    ['a javascript: URL', 'javascript:alert(document.cookie)'],
    ['a data: URL', 'data:text/html,<script>alert(1)</script>'],
    ['a non-string', [`/spaces?spaceId=${spaceId}`]],
    ['a missing value', undefined],
    ['a non-Workspace page', `/settings?spaceId=${spaceId}`],
    ['a look-alike path', `/spacesevil?spaceId=${spaceId}`],
    ['a path traversal out of /spaces', `/spaces/../settings?spaceId=${spaceId}`],
    ['another Workspace', '/spaces/transactions?spaceId=22222222-2222-2222-2222-222222222222'],
    ['no Workspace', '/spaces/transactions'],
  ])('rejects %s', (_, next) => {
    expect(parseSpaceReturnUrl(next, spaceId)).toBeNull()
  })

  it('keeps only the path of a URL that the parser resolves to another host', () => {
    // A tab is stripped by the URL parser, so this resolves to //evil.com/spaces — only the path is kept
    expect(parseSpaceReturnUrl(`/\t/evil.com/spaces?spaceId=${spaceId}`, spaceId)).toEqual({
      pathname: '/spaces',
      query: { spaceId },
    })
  })
})
