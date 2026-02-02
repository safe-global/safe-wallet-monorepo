import { http, HttpResponse, type RequestHandler } from 'msw'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { Portfolio } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import type { SafeApp } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import {
  safeFixtures,
  balancesFixtures,
  portfolioFixtures,
  positionsFixtures,
  safeAppsFixtures,
  type FixtureScenario,
} from '../../../../../config/test/msw/fixtures'
import { createChainData, createChainsPageData } from './chains'
import type { FeatureFlags, MockStoryConfig } from './types'

/**
 * Core chain configuration handlers
 */
export function coreHandlers(chainData: Chain): RequestHandler[] {
  return [
    http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(chainData)),
    http.get(/\/v1\/chains$/, () => HttpResponse.json(createChainsPageData(chainData))),
  ]
}

/**
 * Safe info handlers
 */
export function safeInfoHandlers(safeData: SafeState): RequestHandler[] {
  return [http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+$/, () => HttpResponse.json(safeData))]
}

/**
 * Balances handlers
 */
export function balanceHandlers(balancesData: Balances): RequestHandler[] {
  return [http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/balances\/[a-z]+/, () => HttpResponse.json(balancesData))]
}

/**
 * Portfolio handlers (requires PORTFOLIO_ENDPOINT feature)
 */
export function portfolioHandlers(portfolioData: Portfolio): RequestHandler[] {
  return [http.get(/\/v1\/portfolio\/0x[a-fA-F0-9]+/, () => HttpResponse.json(portfolioData))]
}

/**
 * Positions handlers (requires POSITIONS feature)
 */
export function positionsHandlers(positionsData: Protocol[]): RequestHandler[] {
  return [
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/positions\/[a-z]+/, () => HttpResponse.json(positionsData)),
  ]
}

/**
 * Safe Apps handlers
 */
export function safeAppsHandlers(safeAppsData: SafeApp[]): RequestHandler[] {
  return [http.get(/\/v1\/chains\/\d+\/safe-apps/, () => HttpResponse.json(safeAppsData))]
}

/**
 * Transaction queue handlers
 */
export function txQueueHandlers(txQueueData: object): RequestHandler[] {
  return [
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/transactions\/queued/, () => HttpResponse.json(txQueueData)),
  ]
}

/**
 * Master copies handlers (needed for version checks)
 */
export function masterCopiesHandlers(): RequestHandler[] {
  return [
    http.get(/\/v1\/chains\/\d+\/about\/master-copies/, () =>
      HttpResponse.json([
        { address: '0xd9Db270c1B5E3Bd161E8c8503c55cEFDDe8E6766', version: '1.3.0' },
        { address: '0x6851D6fDFAfD08c0EF60ac1b9c90E5dE6247cEAC', version: '1.4.1' },
      ]),
    ),
  ]
}

/**
 * Targeted messaging handlers (Hypernative) - returns empty by default
 */
export function targetedMessagingHandlers(): RequestHandler[] {
  return [
    http.get(/\/v1\/targeted-messaging\/safes\/0x[a-fA-F0-9]+\/outreaches/, () =>
      HttpResponse.json({ outreaches: [] }),
    ),
  ]
}

/**
 * Mock user data for spaces authentication
 */
export const mockUser = {
  id: 1,
  status: 1 as const,
  wallets: [{ id: 1, address: '0x1234567890123456789012345678901234567890' }],
}

/**
 * Mock space data for spaces feature
 */
export function createMockSpace(spaceId: number = 1) {
  return {
    id: spaceId,
    name: 'Test Space',
    status: 'ACTIVE' as const,
    members: [
      {
        id: 1,
        role: 'ADMIN' as const,
        name: 'Admin User',
        invitedBy: 'system',
        status: 'ACTIVE' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: {
          id: mockUser.id,
          status: 'ACTIVE' as const,
        },
      },
    ],
  }
}

/**
 * Spaces feature handlers - users and spaces API
 */
export function spacesHandlers(): RequestHandler[] {
  return [
    // User with wallets endpoint
    http.get(/\/v1\/users$/, () => HttpResponse.json(mockUser)),
    // Get space by ID
    http.get(/\/v1\/spaces\/\d+$/, ({ params }) => {
      const url = new URL(params[0] as string, 'https://example.com')
      const pathParts = url.pathname.split('/')
      const spaceId = parseInt(pathParts[pathParts.length - 1], 10) || 1
      return HttpResponse.json(createMockSpace(spaceId))
    }),
    // List all spaces for user
    http.get(/\/v1\/spaces$/, () => HttpResponse.json([createMockSpace(1)])),
    // Get space safes
    http.get(/\/v1\/spaces\/\d+\/safes$/, () => HttpResponse.json({ safes: {} })),
  ]
}

/**
 * Empty transaction queue data
 */
export const emptyTxQueue = {
  count: 0,
  next: null,
  previous: null,
  results: [],
}

/**
 * Mock pending transactions for stories
 */
export function createMockPendingTransactions(safeData: SafeState) {
  return {
    count: 3,
    next: null,
    previous: null,
    results: [
      {
        type: 'LABEL' as const,
        label: 'Next',
      },
      {
        type: 'TRANSACTION' as const,
        transaction: {
          id: 'multisig_0x123_0xabc1',
          txHash: null,
          timestamp: Date.now() - 1000 * 60 * 5,
          txStatus: 'AWAITING_CONFIRMATIONS' as const,
          txInfo: {
            type: 'Transfer' as const,
            sender: { value: safeData.address.value, name: null, logoUri: null },
            recipient: {
              value: '0x1234567890123456789012345678901234567890',
              name: 'vitalik.eth',
              logoUri: null,
            },
            direction: 'OUTGOING' as const,
            transferInfo: {
              type: 'ERC20' as const,
              tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
              tokenName: 'USD Coin',
              tokenSymbol: 'USDC',
              logoUri:
                'https://safe-transaction-assets.safe.global/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.png',
              decimals: 6,
              value: '4018860000',
            },
          },
          executionInfo: {
            type: 'MULTISIG' as const,
            nonce: 42,
            confirmationsRequired: 2,
            confirmationsSubmitted: 1,
            missingSigners: [{ value: safeData.owners[1]?.value ?? '', name: null, logoUri: null }],
          },
        },
        conflictType: 'None' as const,
      },
      {
        type: 'TRANSACTION' as const,
        transaction: {
          id: 'multisig_0x123_0xabc2',
          txHash: null,
          timestamp: Date.now() - 1000 * 60 * 60 * 2,
          txStatus: 'AWAITING_CONFIRMATIONS' as const,
          txInfo: {
            type: 'Transfer' as const,
            sender: { value: safeData.address.value, name: null, logoUri: null },
            recipient: {
              value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
              name: null,
              logoUri: null,
            },
            direction: 'OUTGOING' as const,
            transferInfo: {
              type: 'NATIVE_COIN' as const,
              value: '1000000000000000',
            },
          },
          executionInfo: {
            type: 'MULTISIG' as const,
            nonce: 43,
            confirmationsRequired: 2,
            confirmationsSubmitted: 1,
            missingSigners: [{ value: safeData.owners[1]?.value ?? '', name: null, logoUri: null }],
          },
        },
        conflictType: 'None' as const,
      },
      {
        type: 'TRANSACTION' as const,
        transaction: {
          id: 'multisig_0x123_0xabc3',
          txHash: null,
          timestamp: Date.now() - 1000 * 60 * 60 * 24,
          txStatus: 'AWAITING_EXECUTION' as const,
          txInfo: {
            type: 'SettingsChange' as const,
            dataDecoded: {
              method: 'addOwnerWithThreshold',
              parameters: [
                {
                  name: 'owner',
                  type: 'address',
                  value: '0x9876543210987654321098765432109876543210',
                },
                { name: '_threshold', type: 'uint256', value: '2' },
              ],
            },
            settingsInfo: {
              type: 'ADD_OWNER' as const,
              owner: {
                value: '0x9876543210987654321098765432109876543210',
                name: 'New Owner',
                logoUri: null,
              },
              threshold: 2,
            },
          },
          executionInfo: {
            type: 'MULTISIG' as const,
            nonce: 44,
            confirmationsRequired: 2,
            confirmationsSubmitted: 2,
            missingSigners: null,
          },
        },
        conflictType: 'None' as const,
      },
    ],
  }
}

/**
 * Get fixture data for a scenario
 */
export function getFixtureData(scenario: FixtureScenario) {
  const safeData = scenario === 'empty' ? safeFixtures.efSafe : safeFixtures[scenario]
  const balancesData = balancesFixtures[scenario]
  const portfolioData = portfolioFixtures[scenario]
  const positionsData = positionsFixtures[scenario]

  return { safeData, balancesData, portfolioData, positionsData }
}

/**
 * Creates all MSW handlers for a story configuration
 *
 * @param config - Story configuration
 * @returns Array of MSW request handlers
 *
 * @example
 * const handlers = createHandlers({ scenario: 'efSafe' })
 *
 * @example
 * const handlers = createHandlers({
 *   scenario: 'vitalik',
 *   features: { portfolio: true, positions: true },
 *   handlers: [customHandler], // Additional handlers
 * })
 */
export function createHandlers(config: MockStoryConfig = {}): RequestHandler[] {
  const { scenario = 'efSafe', features = {}, handlers: customHandlers = [] } = config

  // Get fixture data for scenario
  const { safeData, balancesData, portfolioData, positionsData } = getFixtureData(scenario)

  // Create chain data with specified features
  const chainData = createChainData(features)

  // Get Safe Apps data
  const safeAppsData = safeAppsFixtures.mainnet

  // Create pending transactions
  const txQueueData = createMockPendingTransactions(safeData)

  // Merge features with defaults
  const mergedFeatures: Required<FeatureFlags> = {
    portfolio: features.portfolio ?? true,
    positions: features.positions ?? true,
    swaps: features.swaps ?? true,
    recovery: features.recovery ?? false,
    hypernative: features.hypernative ?? false,
    earn: features.earn ?? false,
    spaces: features.spaces ?? false,
  }

  // Build handlers array
  const allHandlers: RequestHandler[] = [
    ...coreHandlers(chainData),
    ...safeInfoHandlers(safeData),
    ...balanceHandlers(balancesData),
    ...safeAppsHandlers(safeAppsData),
    ...txQueueHandlers(txQueueData),
    ...masterCopiesHandlers(),
    ...targetedMessagingHandlers(),
  ]

  // Add portfolio handlers if feature enabled
  if (mergedFeatures.portfolio) {
    allHandlers.push(...portfolioHandlers(portfolioData))
  }

  // Add positions handlers if feature enabled
  if (mergedFeatures.positions) {
    allHandlers.push(...positionsHandlers(positionsData))
  }

  // Add spaces handlers if feature enabled
  if (mergedFeatures.spaces) {
    allHandlers.push(...spacesHandlers())
  }

  // Add custom handlers last (can override defaults)
  allHandlers.push(...customHandlers)

  return allHandlers
}
