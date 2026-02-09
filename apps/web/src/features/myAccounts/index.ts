/**
 * MyAccounts Feature - Public API (v3 Architecture)
 *
 * Core feature for managing user Safe accounts.
 * Feature flag: MY_ACCOUNTS (enabled by default, can be disabled via CGW config)
 *
 * @example
 * ```typescript
 * // Component access via feature handle
 * import { MyAccountsFeature } from '@/features/myAccounts'
 * import { useLoadFeature } from '@/features/__core__'
 *
 * function MyComponent() {
 *   const myAccounts = useLoadFeature(MyAccountsFeature)
 *   return <myAccounts.AccountItem.Link ... />
 * }
 *
 * // Shared Safe data hooks (moved to @/hooks/safes)
 * import { useAllSafes, useAllSafesGrouped, isMultiChainSafeItem } from '@/hooks/safes'
 * ```
 */
import { createFeatureHandle } from '@/features/__core__'
import type { MyAccountsContract } from './contract'

// ─────────────────────────────────────────────────────────────────
// FEATURE HANDLE (lazy-loads components when flag is enabled)
// ─────────────────────────────────────────────────────────────────

// Uses FEATURES.MY_ACCOUNTS via mapping in createFeatureHandle
export const MyAccountsFeature = createFeatureHandle<MyAccountsContract>('myAccounts')

// Contract type
export type { MyAccountsContract } from './contract'

// ─────────────────────────────────────────────────────────────────
// PUBLIC HOOKS (always loaded, not lazy)
// ─────────────────────────────────────────────────────────────────

// Safe item data hooks
export { useSafeItemData } from './hooks/useSafeItemData'
export { useMultiAccountItemData } from './hooks/useMultiAccountItemData'

// Navigation and state
export { useVisitedSafes } from './hooks/useVisitedSafes'
export { default as useHasSafes } from './hooks/useHasSafes'
export { useNetworksOfSafe } from './hooks/useNetworksOfSafe'

// Address safety hooks
export { default as useSafeSelectionModal } from './hooks/useSafeSelectionModal'
export { default as useNonPinnedSafeWarning } from './hooks/useNonPinnedSafeWarning'
export { default as useSimilarAddressDetection } from './hooks/useSimilarAddressDetection'
export { useTrustSafe } from './hooks/useTrustSafe'

// Public types
export type * from './types'
