/**
 * MSW Fixture Index
 *
 * Exports real API response data fetched from the Safe Client Gateway.
 * Use these fixtures for realistic Storybook stories.
 *
 * Fixtures are organized by:
 * - Endpoint type (portfolio, balances, positions, safes, chains)
 * - Scenario (ef-safe, vitalik, spam-tokens, safe-token-holder, empty)
 *
 * To refresh fixtures, run:
 *   npx tsx config/test/msw/scripts/fetch-fixtures.ts
 */

import type { Portfolio } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { Chain, ChainPage } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeApp } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'

// Portfolio fixtures
import portfolioEfSafe from './portfolio/ef-safe.json'
import portfolioVitalik from './portfolio/vitalik.json'
import portfolioSpamTokens from './portfolio/spam-tokens.json'
import portfolioSafeTokenHolder from './portfolio/safe-token-holder.json'
import portfolioEmpty from './portfolio/empty.json'

// Balances fixtures
import balancesEfSafe from './balances/ef-safe.json'
import balancesVitalik from './balances/vitalik.json'
import balancesSpamTokens from './balances/spam-tokens.json'
import balancesSafeTokenHolder from './balances/safe-token-holder.json'
import balancesEmpty from './balances/empty.json'

// Positions fixtures
import positionsEfSafe from './positions/ef-safe.json'
import positionsVitalik from './positions/vitalik.json'
import positionsSpamTokens from './positions/spam-tokens.json'
import positionsSafeTokenHolder from './positions/safe-token-holder.json'
import positionsEmpty from './positions/empty.json'

// Safe info fixtures
import safeEfSafe from './safes/ef-safe.json'
import safeVitalik from './safes/vitalik.json'
import safeSpamTokens from './safes/spam-tokens.json'
import safeSafeTokenHolder from './safes/safe-token-holder.json'

// Chain fixtures
import chainsAll from './chains/all.json'
import chainMainnet from './chains/mainnet.json'

// Safe Apps fixtures
import safeAppsMainnet from './safe-apps/mainnet.json'

/**
 * Portfolio fixtures by scenario
 */
export const portfolioFixtures = {
  /** EF Safe - DeFi heavy ($142M in positions, 8 apps) */
  efSafe: portfolioEfSafe as Portfolio,
  /** Vitalik Safe - Whale with many tokens (1551 tokens, $675M) */
  vitalik: portfolioVitalik as Portfolio,
  /** Safe with spam tokens */
  spamTokens: portfolioSpamTokens as Portfolio,
  /** Safe Token holder with diverse DeFi (15 different apps) */
  safeTokenHolder: portfolioSafeTokenHolder as Portfolio,
  /** Empty portfolio */
  empty: portfolioEmpty as Portfolio,
}

/**
 * Balances fixtures by scenario
 */
export const balancesFixtures = {
  /** EF Safe - 32 tokens */
  efSafe: balancesEfSafe as Balances,
  /** Vitalik Safe - 1551 tokens (many spam) */
  vitalik: balancesVitalik as Balances,
  /** Spam tokens Safe */
  spamTokens: balancesSpamTokens as Balances,
  /** Safe Token holder - 25 tokens */
  safeTokenHolder: balancesSafeTokenHolder as Balances,
  /** Empty balances */
  empty: balancesEmpty as Balances,
}

/**
 * Positions fixtures by scenario
 */
export const positionsFixtures = {
  /** EF Safe - Heavy DeFi (8 protocols, $142M) */
  efSafe: positionsEfSafe as Protocol[],
  /** Vitalik Safe - Single protocol */
  vitalik: positionsVitalik as Protocol[],
  /** Spam tokens Safe - 2 protocols */
  spamTokens: positionsSpamTokens as Protocol[],
  /** Safe Token holder - 15 diverse protocols */
  safeTokenHolder: positionsSafeTokenHolder as Protocol[],
  /** No positions */
  empty: positionsEmpty as Protocol[],
}

/**
 * Safe info fixtures by scenario
 */
export const safeFixtures = {
  /** EF Safe */
  efSafe: safeEfSafe as SafeState,
  /** Vitalik Safe */
  vitalik: safeVitalik as SafeState,
  /** Spam tokens Safe */
  spamTokens: safeSpamTokens as SafeState,
  /** Safe Token holder */
  safeTokenHolder: safeSafeTokenHolder as SafeState,
}

/**
 * Chain configuration fixtures
 */
export const chainFixtures = {
  /** All chains */
  all: chainsAll as ChainPage,
  /** Ethereum mainnet */
  mainnet: chainMainnet as Chain,
}

/**
 * Safe Apps fixtures
 */
export const safeAppsFixtures = {
  /** Mainnet Safe Apps (45+ apps) */
  mainnet: safeAppsMainnet as SafeApp[],
  /** Empty Safe Apps list */
  empty: [] as SafeApp[],
}

/**
 * Safe metadata for reference
 */
export const SAFE_ADDRESSES = {
  efSafe: {
    address: '0x9fC3dc011b461664c835F2527fffb1169b3C213e',
    chainId: '1',
  },
  vitalik: {
    address: '0x220866b1a2219f40e72f5c628b65d54268ca3a9d',
    chainId: '1',
  },
  spamTokens: {
    address: '0x9d94ef33e7f8087117f85b3ff7b1d8f27e4053d5',
    chainId: '1',
  },
  safeTokenHolder: {
    address: '0x8675B754342754A30A2AeF474D114d8460bca19b',
    chainId: '1',
  },
} as const

export type FixtureScenario = keyof typeof SAFE_ADDRESSES | 'empty'
