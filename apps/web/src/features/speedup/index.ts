/**
 * Speedup Feature - Public API
 *
 * This feature provides [brief description].
 *
 * ## Usage
 *
 * ```typescript
 * import { SpeedupFeature } from '@/features/speedup'
 * import { useLoadFeature } from '@/features/__core__'
 *
 * function MyComponent() {
 *   const feature = useLoadFeature(SpeedupFeature)
 *
 *   // No null check needed - always returns an object
 *   // Components render null when not ready (proxy stub)
 *   return <feature.SpeedUpModal />
 * }
 *
 * // For explicit loading/disabled states:
 * function MyComponentWithStates() {
 *   const feature = useLoadFeature(SpeedupFeature)
 *
 *   if (feature.$isLoading) return <Skeleton />
 *   if (feature.$isDisabled) return null
 *
 *   return <feature.SpeedUpModal />
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
import type { SpeedupContract } from './contract'

// Feature handle - uses semantic mapping
export const SpeedupFeature = createFeatureHandle<SpeedupContract>('speedup')

// Contract type (for type annotations if needed)
export type { SpeedupContract } from './contract'
