import {
  orderByPreferenceSlice,
  setOrderByPreference,
  selectOrderByPreference,
  OrderByOption,
  ORDER_BY_RESET_VERSION,
} from './orderByPreferenceSlice'
import type { RootState } from '@/store'

describe('orderByPreferenceSlice', () => {
  const { reducer } = orderByPreferenceSlice

  it('defaults to Name (A→Z)', () => {
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.orderBy).toBe(OrderByOption.NAME)
  })

  it('updates the order preference', () => {
    const state = reducer(undefined, setOrderByPreference({ orderBy: OrderByOption.LAST_VISITED }))
    expect(state.orderBy).toBe(OrderByOption.LAST_VISITED)
  })

  it('selector falls back to the Name default when the slice is absent', () => {
    expect(selectOrderByPreference({} as RootState).orderBy).toBe(OrderByOption.NAME)
  })

  it('exposes a numeric reset version for the one-time A→Z migration', () => {
    expect(typeof ORDER_BY_RESET_VERSION).toBe('number')
  })
})
