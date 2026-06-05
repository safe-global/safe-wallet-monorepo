import {
  safeOrderSlice,
  setSpaceSafeOrder,
  clearSpaceSafeOrder,
  selectSpaceSafeOrder,
  type SafeOrderState,
} from '../safeOrderSlice'
import type { RootState } from '@/store'

const reducer = safeOrderSlice.reducer

describe('safeOrderSlice', () => {
  it('returns the initial empty state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({})
  })

  it('stores an order for a space', () => {
    const state = reducer(undefined, setSpaceSafeOrder({ spaceId: '1', order: ['a', 'b', 'c'] }))
    expect(state).toEqual({ '1': ['a', 'b', 'c'] })
  })

  it('overwrites an existing order for the same space', () => {
    const initial: SafeOrderState = { '1': ['a', 'b'] }
    const state = reducer(initial, setSpaceSafeOrder({ spaceId: '1', order: ['b', 'a'] }))
    expect(state['1']).toEqual(['b', 'a'])
  })

  it('keeps orders for other spaces independent', () => {
    const initial: SafeOrderState = { '1': ['a'] }
    const state = reducer(initial, setSpaceSafeOrder({ spaceId: '2', order: ['x', 'y'] }))
    expect(state).toEqual({ '1': ['a'], '2': ['x', 'y'] })
  })

  it('clears the order for a space only', () => {
    const initial: SafeOrderState = { '1': ['a'], '2': ['x'] }
    const state = reducer(initial, clearSpaceSafeOrder({ spaceId: '1' }))
    expect(state).toEqual({ '2': ['x'] })
  })

  describe('selectSpaceSafeOrder', () => {
    const buildState = (safeOrder: SafeOrderState) => ({ [safeOrderSlice.name]: safeOrder }) as unknown as RootState

    it('returns the order for a space', () => {
      expect(selectSpaceSafeOrder(buildState({ '1': ['a', 'b'] }), '1')).toEqual(['a', 'b'])
    })

    it('returns undefined for an unknown space', () => {
      expect(selectSpaceSafeOrder(buildState({ '1': ['a'] }), '2')).toBeUndefined()
    })

    it('returns undefined when spaceId is null', () => {
      expect(selectSpaceSafeOrder(buildState({ '1': ['a'] }), null)).toBeUndefined()
    })
  })
})
