import { act } from 'react'
import { renderHook } from '@/tests/test-utils'
import { getStoreInstance } from '@/store'
import { OrderByOption, ORDER_BY_RESET_VERSION } from '@/store/orderByPreferenceSlice'
import { useSaveManualOrder } from '../useSaveManualOrder'

const SCOPE = 'test-scope'
const ORDER = ['0xA', '0xB', '0xC']
// The slice normalises saved addresses to lowercase.
const SAVED_ORDER = ORDER.map((address) => address.toLowerCase())

describe('useSaveManualOrder', () => {
  // The test store hydrates from localStorage, which otherwise leaks the persisted
  // preference from one test into the next.
  beforeEach(() => localStorage.clear())

  it('saves the order under the scope and switches the sort mode to Manual', () => {
    const { result } = renderHook(() => useSaveManualOrder(SCOPE), {
      initialReduxState: {
        orderByPreference: { orderBy: OrderByOption.NAME, resetVersion: ORDER_BY_RESET_VERSION, manualOrder: {} },
      },
    })

    act(() => result.current(ORDER))

    const { orderByPreference } = getStoreInstance().getState()
    expect(orderByPreference.orderBy).toBe(OrderByOption.MANUAL)
    expect(orderByPreference.manualOrder?.[SCOPE]).toEqual(SAVED_ORDER)
  })

  it('keeps Manual mode when already active', () => {
    const { result } = renderHook(() => useSaveManualOrder(SCOPE), {
      initialReduxState: {
        orderByPreference: { orderBy: OrderByOption.MANUAL, resetVersion: ORDER_BY_RESET_VERSION, manualOrder: {} },
      },
    })

    act(() => result.current(ORDER))

    const { orderByPreference } = getStoreInstance().getState()
    expect(orderByPreference.orderBy).toBe(OrderByOption.MANUAL)
    expect(orderByPreference.manualOrder?.[SCOPE]).toEqual(SAVED_ORDER)
  })

  it('is a no-op without a scope', () => {
    const { result } = renderHook(() => useSaveManualOrder(undefined), {
      initialReduxState: {
        orderByPreference: { orderBy: OrderByOption.NAME, resetVersion: ORDER_BY_RESET_VERSION, manualOrder: {} },
      },
    })

    act(() => result.current(ORDER))

    const { orderByPreference } = getStoreInstance().getState()
    expect(orderByPreference.orderBy).toBe(OrderByOption.NAME)
    expect(orderByPreference.manualOrder).toEqual({})
  })
})
