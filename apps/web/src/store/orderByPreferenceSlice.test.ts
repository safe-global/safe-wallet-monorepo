import {
  orderByPreferenceSlice,
  setOrderByPreference,
  setManualOrder,
  selectOrderByPreference,
  selectManualOrder,
  getSpaceOrderScope,
  TRUSTED_ORDER_SCOPE,
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

  it('supports the Manual order option', () => {
    const state = reducer(undefined, setOrderByPreference({ orderBy: OrderByOption.MANUAL }))
    expect(state.orderBy).toBe(OrderByOption.MANUAL)
  })

  it('stores a per-scope manual order, lowercasing addresses', () => {
    const state = reducer(undefined, setManualOrder({ scope: TRUSTED_ORDER_SCOPE, order: ['0xABC', '0xDef'] }))
    expect(state.manualOrder?.[TRUSTED_ORDER_SCOPE]).toEqual(['0xabc', '0xdef'])
  })

  it('keeps manual orders for different scopes independent', () => {
    let state = reducer(undefined, setManualOrder({ scope: TRUSTED_ORDER_SCOPE, order: ['0x1'] }))
    state = reducer(state, setManualOrder({ scope: getSpaceOrderScope('space-1'), order: ['0x2'] }))
    expect(state.manualOrder?.[TRUSTED_ORDER_SCOPE]).toEqual(['0x1'])
    expect(state.manualOrder?.[getSpaceOrderScope('space-1')]).toEqual(['0x2'])
  })

  it('selectManualOrder returns the order for a scope, or undefined when absent', () => {
    const state = reducer(undefined, setManualOrder({ scope: TRUSTED_ORDER_SCOPE, order: ['0x1'] }))
    const root = { [orderByPreferenceSlice.name]: state } as unknown as RootState
    expect(selectManualOrder(root, TRUSTED_ORDER_SCOPE)).toEqual(['0x1'])
    expect(selectManualOrder(root, getSpaceOrderScope('missing'))).toBeUndefined()
    expect(selectManualOrder({} as RootState, TRUSTED_ORDER_SCOPE)).toBeUndefined()
  })
})
