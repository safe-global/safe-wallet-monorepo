import { setupServer } from 'msw/node'
import type { RequestHandler } from 'msw'
import { handlers as baseHandlers } from './handlers'
import {
  fixtureHandlers,
  createChainHandlersFromFixture,
  createBalanceHandlersFromFixture,
  createPositionHandlersFromFixture,
  createPortfolioHandlersFromFixture,
  createSafeAppsHandlersFromFixture,
} from './handlers/fromFixtures'
import type { FixtureScenario } from './fixtures'
import { FEATURES } from '@safe-global/utils/utils/chains'

const DEFAULT_GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL_STAGING || 'https://safe-client.staging.5afe.dev'

/**
 * Options for createTestServer
 */
export interface TestServerOptions {
  /**
   * Fixture scenario to add on top of the base handlers.
   * When provided, scenario handlers are prepended so they take precedence over base handlers
   * for the same endpoints (MSW matches the first registered handler).
   * @default undefined — only base handlers are used
   */
  scenario?: FixtureScenario
  /**
   * Additional MSW handlers prepended before all others (highest priority, can override anything)
   */
  handlers?: RequestHandler[]
}

/**
 * Creates an MSW server that wraps the standard test handler baseline.
 *
 * The base `handlers` from `config/test/msw/handlers.ts` are always included to maintain
 * backward compatibility with existing tests. Optionally, fixture-scenario handlers can be
 * added for richer data in new tests (they take precedence over the base handlers).
 *
 * Extra handlers are added last and take the highest priority.
 *
 * @example
 * // Default — identical to the existing global server, backward-compatible
 * const server = createTestServer()
 *
 * @example
 * // Fixture scenario for richer data
 * const server = createTestServer({ scenario: 'efSafe' })
 *
 * @example
 * // Override a single handler per test
 * server.use(http.get(/\/v1\/chains/, () => HttpResponse.error()))
 */
export function createTestServer(options: TestServerOptions = {}) {
  const { scenario, handlers: extraHandlers = [] } = options

  const gatewayUrl = DEFAULT_GATEWAY_URL

  const scenarioHandlers: RequestHandler[] =
    scenario === 'empty'
      ? [
          ...createChainHandlersFromFixture(gatewayUrl, [FEATURES.POSITIONS, FEATURES.PORTFOLIO_ENDPOINT]),
          ...createBalanceHandlersFromFixture('empty', gatewayUrl),
          ...createPositionHandlersFromFixture('empty', gatewayUrl),
          ...createPortfolioHandlersFromFixture('empty', gatewayUrl),
          ...createSafeAppsHandlersFromFixture(gatewayUrl, true),
        ]
      : scenario
        ? fixtureHandlers[scenario](gatewayUrl)
        : []

  // Priority order (highest first): extra → scenario → base
  return setupServer(...extraHandlers, ...scenarioHandlers, ...baseHandlers(gatewayUrl))
}
