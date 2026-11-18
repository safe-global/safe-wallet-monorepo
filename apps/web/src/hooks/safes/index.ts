/**
 * Shared Safe account data hooks
 *
 * These hooks provide core Safe account data used across multiple features.
 * They are intentionally placed outside of any feature to avoid circular dependencies.
 */

// Core hooks

export { type SafeItemBuilder } from './useSafeItemBuilder'

// Comparators/utilities

// Types
export type { SafeItem, SafeItems } from './useAllSafes'
export type { MultiChainSafeItem, AllSafeItems, AllSafeItemsGrouped } from './useAllSafesGrouped'
