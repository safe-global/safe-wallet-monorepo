/**
 * TargetedOutreach Feature - Public API
 *
 * This feature provides [brief description].
 *
 * ## Usage
 *
 * ```typescript
 * import { TargetedOutreachFeature, useShowOutreachPopup } from '@/features/targeted-outreach'
 * import { useLoadFeature } from '@/features/__core__'
 *
 * function MyComponent() {
 *   const feature = useLoadFeature(TargetedOutreachFeature)
 *   const data = useShowOutreachPopup()  // Hooks imported directly, always safe
 *
 *   // No null check needed - always returns an object
 *   // Components render null when not ready (proxy stub)
 *   return <feature.OutreachPopup />
 * }
 *
 * // For explicit loading/disabled states:
 * function MyComponentWithStates() {
 *   const feature = useLoadFeature(TargetedOutreachFeature)
 *
 *   if (!feature.$isReady) return <Skeleton />
 *   if (feature.$isDisabled) return null
 *
 *   return <feature.OutreachPopup />
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
import type { TargetedOutreachContract } from './contract'

// Feature handle - uses semantic mapping
export const TargetedOutreachFeature = createFeatureHandle<TargetedOutreachContract>('targeted-outreach')

// Contract type (for type annotations if needed)
export type { TargetedOutreachContract } from './contract'
