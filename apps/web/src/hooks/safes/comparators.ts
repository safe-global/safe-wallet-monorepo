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
