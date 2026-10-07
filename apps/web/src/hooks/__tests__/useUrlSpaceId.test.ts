import { renderHook } from '@/tests/test-utils'
import { getLocationSpaceId, isLegacySpaceId, useUrlSpaceId, withSpaceId, withSpaceIdInUrl } from '../useUrlSpaceId'

const SPACE_UUID = '11111111-1111-1111-1111-111111111111'

const renderWithQuery = (query: Record<string, string | string[]>) =>
  renderHook(() => useUrlSpaceId(), { routerProps: { query } })

describe('useUrlSpaceId', () => {
  afterEach(() => window.history.replaceState(null, '', '/'))

  it('returns the Workspace UUID of the query', () => {
    const { result } = renderWithQuery({ spaceId: SPACE_UUID })

    expect(result.current).toBe(SPACE_UUID)
  })

  it('returns null when the URL has no Workspace', () => {
    const { result } = renderWithQuery({ safe: 'eth:0x0000000000000000000000000000000000000001' })

    expect(result.current).toBeNull()
  })

  it.each([
    ['an empty value', ''],
    ['a value that is not a UUID', 'space-1'],
    ['a UUID with extra characters', `${SPACE_UUID}x`],
  ])('returns null for %s', (_, spaceId) => {
    const { result } = renderWithQuery({ spaceId })

    expect(result.current).toBeNull()
  })

  it('accepts a legacy numeric id, which old links still carry', () => {
    const { result } = renderWithQuery({ spaceId: '12' })

    expect(result.current).toBe('12')
  })

  it('returns null for a repeated spaceId param', () => {
    const { result } = renderWithQuery({ spaceId: [SPACE_UUID, SPACE_UUID] })

    expect(result.current).toBeNull()
  })

  it('reads the location while the router query is still empty during hydration', () => {
    window.history.replaceState(null, '', `/home?safe=eth:0x1&spaceId=${SPACE_UUID}`)

    const { result } = renderWithQuery({})

    expect(result.current).toBe(SPACE_UUID)
  })
})

describe('isLegacySpaceId', () => {
  it('tells a legacy numeric id from a UUID', () => {
    expect(isLegacySpaceId('12')).toBe(true)
    expect(isLegacySpaceId(SPACE_UUID)).toBe(false)
  })
})

describe('getLocationSpaceId', () => {
  afterEach(() => window.history.replaceState(null, '', '/'))

  it('reads the raw spaceId of the page location', () => {
    expect(getLocationSpaceId()).toBeUndefined()

    window.history.replaceState(null, '', `/transactions/queue?safe=eth:0x1&spaceId=${SPACE_UUID}`)

    expect(getLocationSpaceId()).toBe(SPACE_UUID)
  })
})

describe('withSpaceId', () => {
  it('adds the Workspace as the last param of the query', () => {
    const query = withSpaceId({ safe: 'eth:0x1', id: 'tx' }, SPACE_UUID)

    expect(query).toEqual({ safe: 'eth:0x1', id: 'tx', spaceId: SPACE_UUID })
    expect(Object.keys(query)).toEqual(['safe', 'id', 'spaceId'])
  })

  it('returns the query unchanged outside a Workspace or for a malformed id', () => {
    const query = { safe: 'eth:0x1' }

    expect(withSpaceId(query, null)).toBe(query)
    expect(withSpaceId(query, 'space-1')).toBe(query)
    expect(withSpaceId(query, [SPACE_UUID, SPACE_UUID])).toBe(query)
  })
})

describe('withSpaceIdInUrl', () => {
  it('appends the Workspace to the query of a URL', () => {
    expect(withSpaceIdInUrl('/transactions/tx?safe=eth:0x1&id=tx', SPACE_UUID)).toBe(
      `/transactions/tx?safe=eth:0x1&id=tx&spaceId=${SPACE_UUID}`,
    )
    expect(withSpaceIdInUrl('https://app.safe.global/home?safe=eth:0x1', SPACE_UUID)).toBe(
      `https://app.safe.global/home?safe=eth:0x1&spaceId=${SPACE_UUID}`,
    )
  })

  it('starts the query when the URL has none, and keeps the hash at the end', () => {
    expect(withSpaceIdInUrl('/spaces', SPACE_UUID)).toBe(`/spaces?spaceId=${SPACE_UUID}`)
    expect(withSpaceIdInUrl('/home?safe=eth:0x1#assets', SPACE_UUID)).toBe(
      `/home?safe=eth:0x1&spaceId=${SPACE_UUID}#assets`,
    )
  })

  it('returns the URL unchanged outside a Workspace', () => {
    expect(withSpaceIdInUrl('/home?safe=eth:0x1', null)).toBe('/home?safe=eth:0x1')
  })
})
