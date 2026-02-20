/**
 * Portfolio Feature - Public API
 *
 * This feature provides portfolio balance loading and refresh functionality
 * using the Zerion portfolio endpoint with Transaction Service fallback.
 *
 * @feature FEATURES.PORTFOLIO_ENDPOINT - Controls whether the portfolio endpoint is enabled
 * @since v3 feature architecture migration (2026)
 *
 * ## Usage
 *
 * ```typescript
 * import { PortfolioFeature, usePortfolioBalances } from '@/features/portfolio'
 * import { useLoadFeature } from '@/features/__core__'
 *
 * function MyComponent() {
 *   const feature = useLoadFeature(PortfolioFeature)
 *   const [balances] = usePortfolioBalances()
 *
 *   // No null check needed - always returns an object
 *   // Components render null when not ready (proxy stub)
 *   return <feature.PortfolioRefreshHint entryPoint="Dashboard" />
 * }
 *
 * // For explicit loading/disabled states:
 * function MyComponentWithStates() {
 *   const feature = useLoadFeature(PortfolioFeature)
 *
 *   if (!feature.$isReady) return <Skeleton />
 *   if (feature.$isDisabled) return null
 *
 *   return <feature.PortfolioRefreshHint entryPoint="Dashboard" />
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
import type { PortfolioContract } from './contract'

/**
 * Feature handle for portfolio functionality.
 *
 * Uses semantic mapping: 'portfolio' → FEATURES.PORTFOLIO_ENDPOINT
 * The feature flag is configured per-chain in the Safe Config Service.
 */
export const PortfolioFeature = createFeatureHandle<PortfolioContract>('portfolio')

// Contract type (for type annotations if needed)
export type { PortfolioContract } from './contract'

// Hooks exported directly (always loaded, not lazy) to avoid Rules of Hooks violations
export { default as usePortfolioBalances } from './hooks/usePortfolioBalances'
export { default as usePortfolioRefetchOnTxHistory } from './hooks/usePortfolioRefetchOnTxHistory'
