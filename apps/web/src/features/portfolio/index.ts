import { createFeatureHandle } from '@/features/__core__/createFeatureHandle'
import type { PortfolioContract } from './contract'

/**
 * Feature handle for portfolio functionality.
 *
 * Uses semantic mapping: 'portfolio' → FEATURES.PORTFOLIO_ENDPOINT
 * The feature flag is configured per-chain in the Safe Config Service.
 */
export const PortfolioFeature = createFeatureHandle<PortfolioContract>('portfolio')
