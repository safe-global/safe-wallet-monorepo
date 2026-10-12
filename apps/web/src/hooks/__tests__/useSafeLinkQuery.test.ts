import { renderHook } from '@/tests/test-utils'
import { useSafeLinkQuery } from '../useSafeLinkQuery'

const SAFE = 'matic:0x0000000000000000000000000000000000000001'
const SPACE_UUID = '11111111-1111-1111-1111-111111111111'

describe('useSafeLinkQuery', () => {
  afterEach(() => window.history.replaceState(null, '', '/'))

  it('returns the Safe and the Workspace of the router query', () => {
    const { result } = renderHook(() => useSafeLinkQuery(), {
      routerProps: { query: { safe: SAFE, spaceId: SPACE_UUID } },
    })

    expect(result.current).toEqual({ safe: SAFE, spaceId: SPACE_UUID })
  })

  it('reads the Safe from the location while the router query is still empty', () => {
    window.history.replaceState(null, '', `/home?safe=${SAFE}`)

    const { result } = renderHook(() => useSafeLinkQuery(), { routerProps: { query: {} } })

    expect(result.current).toEqual({ safe: SAFE })
  })

  it('returns no Safe outside a Safe page', () => {
    const { result } = renderHook(() => useSafeLinkQuery(), { routerProps: { query: {} } })

    expect(result.current).toEqual({})
  })
})
