import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { selectManualOrder, selectOrderByPreference } from '@/store/orderByPreferenceSlice'
import { getComparator } from './comparators'

/**
 * Resolves the active safe-list comparator for a given ordering scope. The sort direction
 * (Name / Last visited / Manual) is a single global preference; when it's Manual, the scope's
 * persisted custom order is applied. Callers that pass no scope (or a scope with no saved order)
 * fall back to Name under Manual, so non-reorderable lists never render in an arbitrary order.
 */
export const useSafeOrderComparator = (scope?: string) => {
  const { orderBy } = useAppSelector(selectOrderByPreference)
  const manualOrder = useAppSelector((state) => (scope ? selectManualOrder(state, scope) : undefined))
  return useMemo(() => getComparator(orderBy, manualOrder), [orderBy, manualOrder])
}
