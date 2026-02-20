/**
 * Shared Safe account data hooks
 *
 * These hooks provide core Safe account data used across multiple features.
 * They are intentionally placed outside of any feature to avoid circular dependencies.
 */

// Core hooks
export { default as useAllOwnedSafes } from './useAllOwnedSafes'
export { default as useAllSafes, _buildSafeItem, _prepareAddresses } from './useAllSafes'
export {
  useAllSafesGrouped,
  useOwnedSafesGrouped,
  isMultiChainSafeItem,
  _buildSafeItems,
  _buildMultiChainSafeItem,
  _getMultiChainAccounts,
  _getSingleChainAccounts,
  flattenSafeItems,
} from './useAllSafesGrouped'
export { useSafesSearch } from './useSafesSearch'
export { useGetHref } from './useGetHref'

// Comparators/utilities
export { getComparator, nameComparator, lastVisitedComparator } from './comparators'

// Types
export type { SafeItem, SafeItems } from './useAllSafes'
export type { MultiChainSafeItem, AllSafeItems, AllSafeItemsGrouped } from './useAllSafesGrouped'
