import { renderHook } from '@/tests/test-utils'
import { useCurrentSpaceId } from '../useCurrentSpaceId'

const renderWithQuery = (query: Record<string, string | string[] | undefined>) =>
  renderHook(() => useCurrentSpaceId(), { routerProps: { query } })

describe('useCurrentSpaceId', () => {
  it('returns the spaceId from the URL query when set', () => {
    const { result } = renderWithQuery({ spaceId: '42' })
    expect(result.current).toBe('42')
  })

  it('returns null when no spaceId is in the URL', () => {
    const { result } = renderWithQuery({})
    expect(result.current).toBeNull()
  })

  it('returns null for an empty spaceId', () => {
    const { result } = renderWithQuery({ spaceId: '' })
    expect(result.current).toBeNull()
  })

  it('returns null when spaceId is an array (malformed URL)', () => {
    const { result } = renderWithQuery({ spaceId: ['1', '2'] })
    expect(result.current).toBeNull()
  })
})
