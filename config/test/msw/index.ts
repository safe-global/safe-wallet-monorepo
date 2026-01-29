/**
 * MSW (Mock Service Worker) utilities for Storybook and testing
 *
 * This module provides comprehensive mocking infrastructure for the Safe{Wallet} app.
 *
 * @example Basic usage in a story
 * ```typescript
 * import { createAllHandlers } from '@/../config/test/msw'
 *
 * export const Default: Story = {
 *   parameters: {
 *     msw: {
 *       handlers: createAllHandlers('https://safe-client.safe.global'),
 *     },
 *   },
 * }
 * ```
 *
 * @example Using factories for custom data
 * ```typescript
 * import { safeMocks, balanceMocks } from '@/../config/test/msw'
 *
 * const customSafe = safeMocks.highSecurity()
 * const emptyBalances = balanceMocks.empty()
 * ```
 *
 * @example Using scenarios for common states
 * ```typescript
 * import { createErrorHandlers, createLoadingHandlers } from '@/../config/test/msw'
 *
 * export const ErrorState: Story = {
 *   parameters: {
 *     msw: {
 *       handlers: createErrorHandlers('https://safe-client.safe.global'),
 *     },
 *   },
 * }
 * ```
 */

// Handler creators
export {
  createSafeHandlers,
  createTransactionHandlers,
  createBalanceHandlers,
  createWeb3Handlers,
  createAllHandlers,
  createAllHandlersWithPositions,
  allWeb3Handlers,
  ethereumRpcHandlers,
  polygonRpcHandlers,
  arbitrumRpcHandlers,
  // Chain handlers (for feature flags)
  createChainHandlers,
  createBasicChainHandlers,
  createPositionsEnabledHandlers,
  createFullFeaturedChainHandlers,
  createMockChain,
  chainMocks,
  // Positions handlers
  createPositionsHandlers,
  createEmptyPositionsHandlers,
  createMultiplePositionsHandlers,
  createMockPosition,
  createMockProtocol,
  positionMocks,
  // Portfolio handlers
  createPortfolioHandlers,
  createEmptyPortfolioHandlers,
  createFullPortfolioHandlers,
  createMockPortfolio,
  createMockTokenBalance,
  portfolioMocks,
  // Fixture-based handlers (real API data)
  createHandlersFromFixture,
  createChainHandlersFromFixture,
  createSafeHandlersFromFixture,
  createBalanceHandlersFromFixture,
  createPositionHandlersFromFixture,
  createPortfolioHandlersFromFixture,
  fixtureHandlers,
  FIXTURE_SCENARIOS,
} from './handlers'
export type { FixtureScenarioId } from './handlers'

// Fixtures (real API response data)
export {
  portfolioFixtures,
  balancesFixtures,
  positionsFixtures,
  safeFixtures,
  chainFixtures,
  SAFE_ADDRESSES,
} from './fixtures'
export type { FixtureScenario } from './fixtures'

// Mock data factories
export * from './factories'

// Pre-built scenario handlers
export * from './scenarios'
