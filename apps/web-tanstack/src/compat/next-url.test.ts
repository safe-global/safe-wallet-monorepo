import { parseNextQuery, stringifyNextQuery, toHref, toNavigateOptions } from './next-url'

describe('parseNextQuery', () => {
  it('parses a plain query string', () => {
    expect(parseNextQuery('safe=matic%3A0x123&chain=matic')).toEqual({ safe: 'matic:0x123', chain: 'matic' })
  })

  it('accepts a leading question mark', () => {
    expect(parseNextQuery('?safe=eth%3A0xabc')).toEqual({ safe: 'eth:0xabc' })
  })

  it('collects repeated keys into arrays', () => {
    expect(parseNextQuery('id=1&id=2&id=3')).toEqual({ id: ['1', '2', '3'] })
  })

  it('returns an empty object for an empty string', () => {
    expect(parseNextQuery('')).toEqual({})
  })
})

describe('stringifyNextQuery', () => {
  it('keeps the chain prefix colon raw in the safe param', () => {
    // Canonical form matching apps/web's useAdjustUrl — avoids the %3A flash
    // (commit-then-replaceState) on every navigation.
    expect(stringifyNextQuery({ safe: 'matic:0x123' })).toBe('?safe=matic:0x123')
    expect(stringifyNextQuery({ chain: 'eth', safe: 'eth:0xabc' })).toBe('?chain=eth&safe=eth:0xabc')
  })

  it('keeps colons encoded outside the safe param', () => {
    expect(stringifyNextQuery({ appUrl: 'https://app.example' })).toBe('?appUrl=https%3A%2F%2Fapp.example')
  })

  it('keeps the safe param colon encoded when not followed by an address', () => {
    expect(stringifyNextQuery({ safe: 'foo:bar' })).toBe('?safe=foo%3Abar')
  })

  it('serializes arrays as repeated keys', () => {
    expect(stringifyNextQuery({ id: ['1', '2'] })).toBe('?id=1&id=2')
  })

  it('skips null and undefined values', () => {
    expect(stringifyNextQuery({ a: '1', b: undefined, c: null })).toBe('?a=1')
  })

  it('returns an empty string for an empty query', () => {
    expect(stringifyNextQuery({})).toBe('')
  })

  it('keeps boolean and number values as plain strings', () => {
    expect(stringifyNextQuery({ flag: true, page: 2 })).toBe('?flag=true&page=2')
  })
})

describe('toHref', () => {
  it('passes string hrefs through unchanged', () => {
    expect(toHref('/home?safe=matic:0x123')).toBe('/home?safe=matic:0x123')
  })

  it('serializes a UrlObject with a canonical query', () => {
    expect(toHref({ pathname: '/home', query: { safe: 'matic:0x123' } })).toBe('/home?safe=matic:0x123')
  })

  it('supports a string query', () => {
    expect(toHref({ pathname: '/home', query: 'safe=eth%3A0xabc' })).toBe('/home?safe=eth%3A0xabc')
  })

  it('appends a normalized hash', () => {
    expect(toHref({ pathname: '/settings', hash: '#section' })).toBe('/settings#section')
    expect(toHref({ pathname: '/settings', hash: 'section' })).toBe('/settings#section')
  })
})

describe('toNavigateOptions', () => {
  it('splits an inline query out of a string href (raw colon in value)', () => {
    // Regression: the Space dashboard accounts widget pushes this exact shape.
    // Embedding it in `to` made TanStack commit the href without transitioning
    // router state, bouncing the user to /welcome/spaces.
    expect(toNavigateOptions('/home?safe=matic:0x245C153cBa7b65d01706B09a30dEf30190Da1878')).toEqual({
      to: '/home',
      search: { safe: 'matic:0x245C153cBa7b65d01706B09a30dEf30190Da1878' },
      hash: undefined,
    })
  })

  it('converts a UrlObject', () => {
    expect(toNavigateOptions({ pathname: '/spaces', query: { spaceId: 'abc' } })).toEqual({
      to: '/spaces',
      search: { spaceId: 'abc' },
      hash: undefined,
    })
  })

  it('clears the search for hrefs without a query', () => {
    expect(toNavigateOptions('/welcome')).toEqual({ to: '/welcome', search: {}, hash: undefined })
  })

  it('keeps the current search for hash-only hrefs', () => {
    expect(toNavigateOptions('#section')).toEqual({ to: '', search: true, hash: 'section' })
  })

  it('replaces the query for query-only hrefs', () => {
    expect(toNavigateOptions('?tab=history')).toEqual({ to: '', search: { tab: 'history' }, hash: undefined })
  })

  it('treats a question mark after the hash as part of the fragment', () => {
    expect(toNavigateOptions('/page#frag?notaquery')).toEqual({ to: '/page', search: {}, hash: 'frag?notaquery' })
  })
})
