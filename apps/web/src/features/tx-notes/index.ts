/**
 * TxNotes Feature - Public API
 *
 * This feature provides transaction notes functionality.
 *
 * ## Usage
 *
 * ```typescript
 * import { TxNotesFeature } from '@/features/tx-notes'
 * import { useLoadFeature } from '@/features/__core__'
 *
 * function MyComponent() {
 *   const feature = useLoadFeature(TxNotesFeature)
 *
 *   // No null check needed - always returns an object
 *   // Components render null when not ready (proxy stub)
 *   return <feature.TxNote />
 * }
 *
 * // For explicit loading/disabled states:
 * function MyComponentWithStates() {
 *   const feature = useLoadFeature(TxNotesFeature)
 *
 *   if (feature.$isLoading) return <Skeleton />
 *   if (feature.$isDisabled) return null
 *
 *   return <feature.TxNote />
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
import type { TxNotesContract } from './contract'

// Feature handle - uses semantic mapping
export const TxNotesFeature = createFeatureHandle<TxNotesContract>('tx-notes')

// Contract type (for type annotations if needed)
export type { TxNotesContract } from './contract'
