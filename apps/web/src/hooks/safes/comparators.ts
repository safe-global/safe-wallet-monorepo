import { OrderByOption } from '@/store/orderByPreferenceSlice'
import type { SafeItem } from './useAllSafes'
import type { MultiChainSafeItem } from './useAllSafesGrouped'

export const nameComparator = (a: SafeItem | MultiChainSafeItem, b: SafeItem | MultiChainSafeItem) => {
  // Put undefined names last
  if (!a.name && !b.name) return 0
  if (!a.name) return 1
  if (!b.name) return -1
  return a.name.localeCompare(b.name)
}

export const lastVisitedComparator = (a: SafeItem | MultiChainSafeItem, b: SafeItem | MultiChainSafeItem) => {
  return b.lastVisited - a.lastVisited
}

export const getComparator = (orderBy: OrderByOption) => {
  return orderBy === OrderByOption.NAME ? nameComparator : lastVisitedComparator
}

/**
 * Sort state for the unified Safe accounts table (SafesTable). Kept separate from the shared
 * `getComparator` / `orderByPreferenceSlice` so the table owns its own sort.
 *
 * Balance sorting is handled by the table itself (from the live balances each row reports), so
 * this helper only produces the name comparator with a direction.
 */
export type SafeListSortColumn = 'name' | 'balance'
export type SafeListSortDirection = 'asc' | 'desc'

export const getSafeListComparator = (_column: SafeListSortColumn, direction: SafeListSortDirection) => {
  return (a: SafeItem | MultiChainSafeItem, b: SafeItem | MultiChainSafeItem) => {
    const result = nameComparator(a, b)
    return direction === 'desc' ? -result : result
  }
}
