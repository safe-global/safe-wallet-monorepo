import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  OrderByOption,
  selectOrderByPreference,
  setManualOrder,
  setOrderByPreference,
} from '@/store/orderByPreferenceSlice'

/**
 * Returns the drop handler for a reorderable safe list: persists the dropped order under the
 * given scope and switches the global sort preference to Manual, which then owns the order.
 */
export const useSaveManualOrder = (scope?: string) => {
  const dispatch = useAppDispatch()
  const { orderBy } = useAppSelector(selectOrderByPreference)

  return useCallback(
    (order: string[]) => {
      if (!scope) return
      dispatch(setManualOrder({ scope, order }))
      if (orderBy !== OrderByOption.MANUAL) dispatch(setOrderByPreference({ orderBy: OrderByOption.MANUAL }))
    },
    [dispatch, scope, orderBy],
  )
}
