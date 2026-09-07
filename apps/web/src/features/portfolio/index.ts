/**
 * Portfolio Feature - Public API
 *
 * This feature provides portfolio balance loading and refresh functionality
 * using the Zerion portfolio endpoint with Transaction Service fallback.
 *
 * @feature FEATURES.PORTFOLIO_ENDPOINT - Controls whether the portfolio endpoint is enabled
 * @since v3 feature architecture migration (2026)
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
export { default as usePortfolioRefetchOnTxHistory } from './hooks/usePortfolioRefetchOnTxHistory'
