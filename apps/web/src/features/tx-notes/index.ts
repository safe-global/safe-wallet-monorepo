/**
 * TxNotes Feature - Public API
 *
 * This feature provides [brief description].
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
 * All feature functionality is accessed via flat structure from useLoadFeature().
 * Naming conventions determine stub behavior:
 * - PascalCase → component (stub renders null)
 * - useSomething → hook (stub returns {})
 * - camelCase → service (stub is no-op)
 */

import { createFeatureHandle } from '@/features/__core__'
import type { TxNotesContract } from './contract'

// Feature handle - uses semantic mapping
export const TxNotesFeature = createFeatureHandle<TxNotesContract>('tx-notes')
