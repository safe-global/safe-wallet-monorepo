import { act, renderHook } from '@testing-library/react'
import { useFilterSelection } from '@safe-global/views/components/common/Filters/useFilterSelection'

describe('useFilterSelection', () => {
  it('starts from the initial selection', () => {
    const { result } = renderHook(() => useFilterSelection({ status: ['sign'] }))
    expect(result.current.selection).toEqual({ status: ['sign'] })
  })

  it('toggles values per dimension', () => {
    const { result } = renderHook(() => useFilterSelection())

    act(() => result.current.toggle('status', 'sign'))
    act(() => result.current.toggle('status', 'execute'))
    act(() => result.current.toggle('safe', 'grants'))
    expect(result.current.selection).toEqual({ status: ['sign', 'execute'], safe: ['grants'] })

    act(() => result.current.toggle('status', 'sign'))
    expect(result.current.selection.status).toEqual(['execute'])
  })

  it('clears one dimension and keeps the others', () => {
    const { result } = renderHook(() => useFilterSelection({ status: ['sign'], safe: ['grants'] }))

    act(() => result.current.clear('status'))
    expect(result.current.selection).toEqual({ status: [], safe: ['grants'] })
  })

  it('resets every dimension', () => {
    const { result } = renderHook(() => useFilterSelection({ status: ['sign'], safe: ['grants'] }))

    act(() => result.current.reset())
    expect(result.current.selection).toEqual({})
  })
})
