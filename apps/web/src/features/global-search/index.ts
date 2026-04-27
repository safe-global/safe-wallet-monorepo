/**
 * GlobalSearch Feature - Public API
 *
 * This feature provides global search functionality across spaces.
 *
 * ## Usage
 *
 * ```typescript
 * import { GlobalSearchFeature } from '@/features/global-search'
 * import { useLoadFeature } from '@/features/__core__'
 *
 * function MyComponent() {
 *   const { GlobalSearchInput } = useLoadFeature(GlobalSearchFeature)
 *   return <GlobalSearchInput />
 * }
 * ```
 *
 * Components and services are accessed via flat structure from useLoadFeature().
 * Hooks are exported directly (always loaded, not lazy) to avoid Rules of Hooks violations.
 *
 * Naming conventions determine stub behavior:
 * - PascalCase -> component (stub renders null)
 * - camelCase -> service (undefined when not ready)
 */

import { createFeatureHandle } from '@/features/__core__'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { GlobalSearchContract } from './contract'

// Feature handle - uses SPACES flag since global search is part of the spaces experience
export const GlobalSearchFeature = createFeatureHandle<GlobalSearchContract>('global-search', FEATURES.SPACES)

// Contract type (for type annotations if needed)
export type { GlobalSearchContract } from './contract'
