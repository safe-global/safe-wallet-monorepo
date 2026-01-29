/**
 * Recovery Feature - Public API
 *
 * This feature provides account recovery functionality, allowing trusted recoverers
 * to regain access to a Safe account by changing its signers after a review period.
 *
 * ## Usage
 *
 * ```typescript
 * import { RecoveryFeature, useIsRecoverer } from '@/features/recovery'
 * import { useLoadFeature } from '@/features/__core__'
 *
 * function MyComponent() {
 *   const feature = useLoadFeature(RecoveryFeature)
 *   const data = useIsRecoverer()  // Hooks imported directly, always safe
 *
 *   // No null check needed - always returns an object
 *   // Components render null when not ready (proxy stub)
 *   return <feature.CancelRecoveryButton />
 * }
 *
 * // For explicit loading/disabled states:
 * function MyComponentWithStates() {
 *   const feature = useLoadFeature(RecoveryFeature)
 *
 *   if (feature.$isLoading) return <Skeleton />
 *   if (feature.$isDisabled) return null
 *
 *   return <feature.CancelRecoveryButton />
 * }
 * ```
 *
 * Components and services are accessed via flat structure from useLoadFeature().
 * Hooks are exported directly (always loaded, not lazy) to avoid Rules of Hooks violations.
 *
 * Naming conventions determine stub behavior:
 * - PascalCase → component (stub renders null)
 * - camelCase → service (undefined when not ready)
 */

import { createFeatureHandle } from '@/features/__core__'
import type { RecoveryContract } from './contract'

// Feature handle - uses semantic mapping
export const RecoveryFeature = createFeatureHandle<RecoveryContract>('recovery')

// Contract type (for type annotations if needed)
export type { RecoveryContract } from './contract'

// Hooks exported directly (always loaded, not in contract)
// Keep hooks lightweight - minimal imports, heavy logic in services if needed
export { useIsRecoverer } from './hooks/useIsRecoverer'
export { useIsRecoverySupported } from './hooks/useIsRecoverySupported'
export { default as useRecovery } from './hooks/useRecovery'
export { useRecoveryQueue } from './hooks/useRecoveryQueue'
// NOTE: useIsValidRecoveryExecTransactionFromModule is NOT exported here because it
// imports @gnosis.pm/zodiac which is heavy. Import directly from hooks file if needed.

// Public types (type-only exports are tree-shaken by bundler)
export type { RecoveryQueueItem, RecoveryStateItem, RecoveryState } from './services/recovery-state'
