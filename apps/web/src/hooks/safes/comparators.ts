import { OrderByOption } from '@/store/orderByPreferenceSlice'
import type { SafeItem } from './useAllSafes'
import type { MultiChainSafeItem } from './useAllSafesGrouped'

type SortableSafe = SafeItem | MultiChainSafeItem

export const nameComparator = (a: SortableSafe, b: SortableSafe) => {
  // Put undefined names last
  if (!a.name && !b.name) return 0
  if (!a.name) return 1
  if (!b.name) return -1
  return a.name.localeCompare(b.name)
}

export const lastVisitedComparator = (a: SortableSafe, b: SortableSafe) => {
  return b.lastVisited - a.lastVisited
}

/**
 * Orders safes by an explicit, user-defined sequence of lowercased addresses. Addresses missing
 * from the sequence (e.g. a Safe trusted after the order was saved) sink to the bottom, where they
 * keep a stable A→Z order so the list never jumps around them.
 */
export const manualComparator = (order: string[]) => {
  const rank = new Map(order.map((address, index) => [address.toLowerCase(), index]))
  return (a: SortableSafe, b: SortableSafe) => {
    const ai = rank.get(a.address.toLowerCase()) ?? Infinity
    const bi = rank.get(b.address.toLowerCase()) ?? Infinity
    if (ai !== bi) return ai - bi
    return nameComparator(a, b)
  }
}

export const getComparator = (orderBy: OrderByOption, manualOrder?: string[]) => {
  if (orderBy === OrderByOption.MANUAL) {
    // Without a saved order (or on a surface that defines none), Manual falls back to A→Z.
    return manualOrder && manualOrder.length > 0 ? manualComparator(manualOrder) : nameComparator
  }
  return orderBy === OrderByOption.NAME ? nameComparator : lastVisitedComparator
}
