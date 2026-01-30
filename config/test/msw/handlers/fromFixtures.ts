import { http, HttpResponse } from 'msw'
import type { Portfolio } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { Chain, ChainPage } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeApp } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { FEATURES } from '@safe-global/utils/utils/chains'
import {
  portfolioFixtures,
  balancesFixtures,
  positionsFixtures,
  safeFixtures,
  chainFixtures,
  safeAppsFixtures,
  type FixtureScenario,
} from '../fixtures'

/**
 * Handlers from Fixtures
 *
 * Creates MSW handlers using real API response fixtures.
 * This ensures mock data matches actual API shapes exactly.
 */

type ScenarioKey = Exclude<FixtureScenario, 'empty'>

/**
 * Create all handlers for a specific fixture scenario
 *
 * @example
 * // In a story:
 * parameters: {
 *   msw: {
 *     handlers: createHandlersFromFixture('efSafe', GATEWAY_URL),
 *   },
 * }
 */
export const createHandlersFromFixture = (
  scenario: ScenarioKey,
  GATEWAY_URL: string,
  options: {
    /** Override chain features */
    features?: (FEATURES | string)[]
    /** Include positions endpoint */
    includePositions?: boolean
    /** Include portfolio endpoint */
    includePortfolio?: boolean
    /** Include Safe Apps endpoint */
    includeSafeApps?: boolean
  } = {},
) => {
  const { features, includePositions = true, includePortfolio = true, includeSafeApps = true } = options

  const handlers = [
    // Chain config (with optional feature overrides)
    ...createChainHandlersFromFixture(GATEWAY_URL, features),
    // Safe info
    ...createSafeHandlersFromFixture(scenario, GATEWAY_URL),
    // Balances
    ...createBalanceHandlersFromFixture(scenario, GATEWAY_URL),
  ]

  if (includePositions) {
    handlers.push(...createPositionHandlersFromFixture(scenario, GATEWAY_URL))
  }

  if (includePortfolio) {
    handlers.push(...createPortfolioHandlersFromFixture(scenario, GATEWAY_URL))
  }

  if (includeSafeApps) {
    handlers.push(...createSafeAppsHandlersFromFixture(GATEWAY_URL))
  }

  return handlers
}

/**
 * Create chain handlers from fixtures with optional feature overrides
 */
export const createChainHandlersFromFixture = (GATEWAY_URL: string, featureOverrides?: (FEATURES | string)[]) => {
  const chainData = { ...chainFixtures.mainnet }

  // Override features if provided
  if (featureOverrides) {
    chainData.features = featureOverrides
  }

  return [
    http.get<never, never, ChainPage>(`${GATEWAY_URL}/v1/chains`, () => {
      return HttpResponse.json({
        ...chainFixtures.all,
        results: [chainData],
      })
    }),

    http.get<{ chainId: string }, never, Chain>(`${GATEWAY_URL}/v1/chains/:chainId`, () => {
      return HttpResponse.json(chainData)
    }),
  ]
}

/**
 * Create safe info handlers from fixtures
 */
export const createSafeHandlersFromFixture = (scenario: ScenarioKey, GATEWAY_URL: string) => {
  const safeData = safeFixtures[scenario]

  return [
    http.get<{ chainId: string; safeAddress: string }, never, SafeState>(
      `${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress`,
      () => {
        return HttpResponse.json(safeData)
      },
    ),
  ]
}

/**
 * Create balance handlers from fixtures
 */
export const createBalanceHandlersFromFixture = (scenario: ScenarioKey | 'empty', GATEWAY_URL: string) => {
  const balancesData = balancesFixtures[scenario]

  return [
    http.get<{ chainId: string; safeAddress: string; currency: string }, never, Balances>(
      `${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/balances/:currency`,
      () => {
        return HttpResponse.json(balancesData)
      },
    ),
  ]
}

/**
 * Create position handlers from fixtures
 */
export const createPositionHandlersFromFixture = (scenario: ScenarioKey | 'empty', GATEWAY_URL: string) => {
  const positionsData = positionsFixtures[scenario]

  return [
    http.get<{ chainId: string; safeAddress: string; fiatCode: string }, never, Protocol[]>(
      `${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/positions/:fiatCode`,
      () => {
        return HttpResponse.json(positionsData)
      },
    ),
  ]
}

/**
 * Create portfolio handlers from fixtures
 */
export const createPortfolioHandlersFromFixture = (scenario: ScenarioKey | 'empty', GATEWAY_URL: string) => {
  const portfolioData = portfolioFixtures[scenario]

  return [
    http.get<{ address: string }, never, Portfolio>(`${GATEWAY_URL}/v1/portfolio/:address`, () => {
      return HttpResponse.json(portfolioData)
    }),
  ]
}

/**
 * Create Safe Apps handlers from fixtures
 */
export const createSafeAppsHandlersFromFixture = (GATEWAY_URL: string, empty = false) => {
  const safeAppsData = empty ? safeAppsFixtures.empty : safeAppsFixtures.mainnet

  return [
    http.get<{ chainId: string }, never, SafeApp[]>(`${GATEWAY_URL}/v1/chains/:chainId/safe-apps`, () => {
      return HttpResponse.json(safeAppsData)
    }),
  ]
}

/**
 * Fixture scenario metadata for documentation and Storybook selectors
 */
export const FIXTURE_SCENARIOS = {
  efSafe: {
    id: 'efSafe',
    name: 'EF Safe - DeFi Heavy',
    description: '$142M in DeFi positions across 8 protocols. Tests position aggregation and double accounting.',
    tokens: 32,
    positions: '$142M',
    defiApps: 8,
  },
  vitalik: {
    id: 'vitalik',
    name: 'Vitalik - Whale',
    description: '1551 tokens, $675M in holdings. Tests large token lists and rendering performance.',
    tokens: 1551,
    positions: '$19M',
    defiApps: 1,
  },
  spamTokens: {
    id: 'spamTokens',
    name: 'Spam Tokens',
    description: 'Safe with many spam tokens. Tests spam filtering and token display.',
    tokens: 26,
    positions: '$1.7M',
    defiApps: 2,
  },
  safeTokenHolder: {
    id: 'safeTokenHolder',
    name: 'Safe Token - Diverse DeFi',
    description: '15 different DeFi protocols including locked/reward positions. Tests protocol diversity.',
    tokens: 25,
    positions: '$707',
    defiApps: 15,
  },
  empty: {
    id: 'empty',
    name: 'Empty',
    description: 'No tokens, no positions. Tests empty states and onboarding flows.',
    tokens: 0,
    positions: '$0',
    defiApps: 0,
  },
  withoutPositions: {
    id: 'withoutPositions',
    name: 'Without Positions Feature',
    description: 'POSITIONS feature flag disabled. Tests classic balances-only view.',
    tokens: 32,
    positions: 'N/A (feature disabled)',
    defiApps: 0,
  },
} as const

export type FixtureScenarioId = keyof typeof FIXTURE_SCENARIOS

/**
 * Pre-configured handler sets for common scenarios
 *
 * @example
 * // In Storybook story:
 * export const DefiHeavy: Story = {
 *   parameters: {
 *     msw: { handlers: fixtureHandlers.efSafe(GATEWAY_URL) },
 *   },
 * }
 *
 * @example
 * // With Storybook select control:
 * argTypes: {
 *   scenario: {
 *     control: 'select',
 *     options: Object.keys(FIXTURE_SCENARIOS),
 *     mapping: Object.fromEntries(
 *       Object.keys(FIXTURE_SCENARIOS).map(key => [key, fixtureHandlers[key](GATEWAY_URL)])
 *     ),
 *   },
 * }
 */
export const fixtureHandlers = {
  /**
   * EF Safe - DeFi Heavy
   *
   * - $142M in DeFi positions across 8 protocols
   * - 32 tokens ($4.5M)
   * - Best for: Testing position aggregation, double accounting scenarios
   */
  efSafe: (GATEWAY_URL: string) =>
    createHandlersFromFixture('efSafe', GATEWAY_URL, {
      features: [FEATURES.POSITIONS, FEATURES.PORTFOLIO_ENDPOINT],
    }),

  /**
   * Vitalik Safe - Whale
   *
   * - 1551 tokens, $675M in holdings
   * - Single DeFi protocol ($19M)
   * - Best for: Testing large token lists, rendering performance, whale scenarios
   *
   * ⚠️ Large fixture (~540KB) - may impact story load time
   */
  vitalik: (GATEWAY_URL: string) =>
    createHandlersFromFixture('vitalik', GATEWAY_URL, {
      features: [FEATURES.POSITIONS, FEATURES.PORTFOLIO_ENDPOINT],
    }),

  /**
   * Spam Tokens Safe
   *
   * - 26 tokens with many obvious spam tokens
   * - $85M total, $1.7M in positions
   * - Best for: Testing spam filtering, token hiding
   */
  spamTokens: (GATEWAY_URL: string) =>
    createHandlersFromFixture('spamTokens', GATEWAY_URL, {
      features: [FEATURES.POSITIONS, FEATURES.PORTFOLIO_ENDPOINT],
    }),

  /**
   * Safe Token Holder - Diverse DeFi
   *
   * - 15 different DeFi protocols (Aave, Compound, Lido, etc.)
   * - SAFE token with locked and reward positions
   * - Best for: Testing protocol diversity, Zerion aggregation edge cases
   */
  safeTokenHolder: (GATEWAY_URL: string) =>
    createHandlersFromFixture('safeTokenHolder', GATEWAY_URL, {
      features: [FEATURES.POSITIONS, FEATURES.PORTFOLIO_ENDPOINT],
    }),

  /**
   * Empty State
   *
   * - No tokens, no positions
   * - Best for: Testing empty states, onboarding flows, first-time user experience
   */
  empty: (GATEWAY_URL: string) => [
    ...createChainHandlersFromFixture(GATEWAY_URL, [FEATURES.POSITIONS, FEATURES.PORTFOLIO_ENDPOINT]),
    ...createBalanceHandlersFromFixture('empty', GATEWAY_URL),
    ...createPositionHandlersFromFixture('empty', GATEWAY_URL),
    ...createPortfolioHandlersFromFixture('empty', GATEWAY_URL),
  ],

  /**
   * Without Positions Feature Flag
   *
   * - POSITIONS and PORTFOLIO_ENDPOINT features disabled
   * - Shows classic balances-only view
   * - Best for: Testing feature flag behavior, backwards compatibility
   */
  withoutPositions: (GATEWAY_URL: string) =>
    createHandlersFromFixture('efSafe', GATEWAY_URL, {
      features: [], // No POSITIONS feature
      includePositions: false,
      includePortfolio: false,
    }),
}
