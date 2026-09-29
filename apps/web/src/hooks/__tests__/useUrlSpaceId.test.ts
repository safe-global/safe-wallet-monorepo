import { renderHook } from '@/tests/test-utils'
import {
  getLocationSpaceIdQuery,
  getRouterSpaceIdQuery,
  getSpaceIdQuery,
  getSpaceIdSearchParam,
  useSpaceIdQuery,
  useUrlSpaceId,
} from '../useUrlSpaceId'

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

describe('Workspace link helpers', () => {
  afterEach(() => window.history.replaceState(null, '', '/'))

  it('builds a query to spread into a link, empty outside a Workspace', () => {
    expect(getSpaceIdQuery(SPACE_UUID)).toEqual({ spaceId: SPACE_UUID })
    expect(getSpaceIdQuery(null)).toEqual({})
  })

  it('builds a search param for a string link, empty outside a Workspace', () => {
    expect(getSpaceIdSearchParam(SPACE_UUID)).toBe(`&spaceId=${SPACE_UUID}`)
    expect(getSpaceIdSearchParam(null)).toBe('')
  })

  it('reads the Workspace of a router, and ignores a malformed one or a router without query', () => {
    expect(getRouterSpaceIdQuery({ query: { spaceId: SPACE_UUID } })).toEqual({ spaceId: SPACE_UUID })
    expect(getRouterSpaceIdQuery({ query: { spaceId: 'space-1' } })).toEqual({})
    expect(getRouterSpaceIdQuery({} as Parameters<typeof getRouterSpaceIdQuery>[0])).toEqual({})
  })

  it('reads the Workspace of the page location', () => {
    expect(getLocationSpaceIdQuery()).toEqual({})

    window.history.replaceState(null, '', `/transactions/queue?safe=eth:0x1&spaceId=${SPACE_UUID}`)

    expect(getLocationSpaceIdQuery()).toEqual({ spaceId: SPACE_UUID })
  })

  it('returns the same query object while the Workspace stays the same', () => {
    const { result, rerender } = renderHook(() => useSpaceIdQuery(), {
      routerProps: { query: { spaceId: SPACE_UUID } },
    })
    const first = result.current

    rerender()

    expect(result.current).toEqual({ spaceId: SPACE_UUID })
    expect(result.current).toBe(first)
  })
})
