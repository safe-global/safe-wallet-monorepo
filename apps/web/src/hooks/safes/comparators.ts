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

// Comparators for keys that live on SafeItem. Other orders — e.g. balance, which comes from
// SafeOverview and is sorted on enriched data only in the dropdown — aren't listed and fall back
// to name, so lazy-loaded lists stay sensibly ordered when the shared preference is one of them.
const COMPARATORS: Partial<Record<OrderByOption, Comparator>> = {
  [OrderByOption.NAME]: nameComparator,
  [OrderByOption.LAST_VISITED]: lastVisitedComparator,
}

export const getComparator = (orderBy: OrderByOption): Comparator => COMPARATORS[orderBy] ?? nameComparator
