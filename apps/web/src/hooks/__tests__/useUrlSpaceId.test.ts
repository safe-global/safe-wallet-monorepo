import { renderHook } from '@/tests/test-utils'
import { useUrlSpaceId } from '../useUrlSpaceId'

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
