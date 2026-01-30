/**
 * MSW (Mock Service Worker) utilities for Storybook and testing
 *
 * This module re-exports fixtures for convenient access.
 * For handler creation, import directly from './handlers' or './fixtures'.
 *
 * @example Using fixtures in stories
 * ```typescript
 * import { balancesFixtures, safeFixtures, chainFixtures } from '@safe-global/test/msw/fixtures'
 * ```
 */

// Re-export fixtures for convenient access
export {
  portfolioFixtures,
  balancesFixtures,
  positionsFixtures,
  safeFixtures,
  chainFixtures,
  safeAppsFixtures,
  SAFE_ADDRESSES,
} from './fixtures'
export type { FixtureScenario } from './fixtures'
