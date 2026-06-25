import { OrderByOption } from '@/store/orderByPreferenceSlice'
import type { SafeItem } from './useAllSafes'
import type { MultiChainSafeItem } from './useAllSafesGrouped'

type Comparator = (a: SafeItem | MultiChainSafeItem, b: SafeItem | MultiChainSafeItem) => number

export const nameComparator: Comparator = (a, b) => {
  // Put undefined names last
  if (!a.name && !b.name) return 0
  if (!a.name) return 1
  if (!b.name) return -1
  return a.name.localeCompare(b.name)
}

export const lastVisitedComparator: Comparator = (a, b) => b.lastVisited - a.lastVisited

// Balance isn't on SafeItem (it's sorted on enriched data in the dropdown); unlisted orders fall back to name.
const COMPARATORS: Partial<Record<OrderByOption, Comparator>> = {
  [OrderByOption.NAME]: nameComparator,
  [OrderByOption.LAST_VISITED]: lastVisitedComparator,
}

export const getComparator = (orderBy: OrderByOption): Comparator => COMPARATORS[orderBy] ?? nameComparator
