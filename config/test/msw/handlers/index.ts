/**
 * MSW Handlers for Storybook Stories
 *
 * This module provides MSW handlers for mocking Safe Client Gateway API responses.
 *
 * ## Primary API: Fixture-based handlers (recommended for stories)
 *
 * Use `fixtureHandlers` for realistic data from real API responses:
 *
 * ```typescript
 * import { fixtureHandlers, FIXTURE_SCENARIOS } from '@safe-global/test/msw/handlers'
 *
 * export const DefiHeavy: Story = {
 *   parameters: {
 *     msw: { handlers: fixtureHandlers.efSafe(GATEWAY_URL) },
 *   },
 * }
 * ```
 *
 * ## Available Scenarios
 *
 * - `efSafe` - $142M DeFi positions, 8 protocols
 * - `vitalik` - 1551 tokens, whale scenario
 * - `spamTokens` - Spam token testing
 * - `safeTokenHolder` - 15 diverse DeFi protocols
 * - `empty` - Empty state testing
 * - `withoutPositions` - Feature flag disabled
 *
 * ## Utility Handlers
 *
 * For endpoints not covered by fixtures:
 * - `createSafeHandlers` - Auth, relay, messages
 * - `createTransactionHandlers` - Transaction queue/history
 * - `allWeb3Handlers` - Web3 RPC mocks
 */

// Fixture-based handlers (primary API for stories)
export {
  createHandlersFromFixture,
  createChainHandlersFromFixture,
  createSafeHandlersFromFixture,
  createBalanceHandlersFromFixture,
  createPositionHandlersFromFixture,
  createPortfolioHandlersFromFixture,
  createSafeAppsHandlersFromFixture,
  fixtureHandlers,
  FIXTURE_SCENARIOS,
} from './fromFixtures'
export type { FixtureScenarioId } from './fromFixtures'

// Utility handlers (for endpoints not in fixtures)
export { createSafeHandlers } from './safe'
export { createTransactionHandlers } from './transactions'
export {
  createWeb3Handlers,
  allWeb3Handlers,
  ethereumRpcHandlers,
  polygonRpcHandlers,
  arbitrumRpcHandlers,
} from './web3'

import { fixtureHandlers } from './fromFixtures'
import { createSafeHandlers } from './safe'
import { createTransactionHandlers } from './transactions'
import { allWeb3Handlers } from './web3'

/**
 * Create all handlers for a complete Storybook story
 *
 * Combines fixture data with utility handlers for a fully mocked environment.
 *
 * @param GATEWAY_URL - The gateway URL to mock
 * @param scenario - Fixture scenario to use (default: 'efSafe')
 */
export const createAllHandlers = (GATEWAY_URL: string, scenario: keyof typeof fixtureHandlers = 'efSafe') => [
  ...fixtureHandlers[scenario](GATEWAY_URL),
  ...createSafeHandlers(GATEWAY_URL),
  ...createTransactionHandlers(GATEWAY_URL),
  ...allWeb3Handlers,
]
