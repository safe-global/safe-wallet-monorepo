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

import type { FeatureHandle } from '@/features/__core__'
import type { GlobalSearchContract } from './contract'

// Core feature: always enabled, not gated by a CGW feature flag.
export const GlobalSearchFeature: FeatureHandle<GlobalSearchContract> = {
  name: 'global-search',
  useIsEnabled: () => true,
  load: () => import(/* webpackMode: "lazy" */ './feature') as Promise<{ default: GlobalSearchContract }>,
}

// Contract type (for type annotations if needed)
export type { GlobalSearchContract } from './contract'
