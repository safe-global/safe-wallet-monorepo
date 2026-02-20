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
 * Transaction history handlers
 */
export function txHistoryHandlers(txHistoryData: object): RequestHandler[] {
  return [
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/transactions\/history/, () => HttpResponse.json(txHistoryData)),
  ]
}

/**
 * Transaction details handlers - returns details for individual transactions
 */
export function txDetailsHandlers(safeData: SafeState): RequestHandler[] {
  return [
    http.get(/\/v1\/chains\/\d+\/transactions\//, ({ request }) => {
      const url = new URL(request.url)
      const pathParts = url.pathname.split('/')
      const txId = pathParts[pathParts.length - 1]

      // Create mock transaction details based on the transaction ID
      const txDetails = createMockTransactionDetails(safeData, txId)
      return HttpResponse.json(txDetails)
    }),
  ]
}

/**
 * Create mock transaction details for a given transaction ID
 * Uses real CGW fixture data as a base, customized for the story context
 */
export function createMockTransactionDetails(safeData: SafeState, txId: string) {
  const now = Date.now()
  const isERC20 = txId.includes('abc1') || txId.includes('exec1')
  const isSettings = txId.includes('abc3') || txId.includes('exec3')
  const isExecuted = txId.includes('exec')

  // Generate a valid-looking signature (65 bytes = 130 hex chars)
  const mockSignature = '0x' + 'ab'.repeat(65)

  // Base details customized for the story
  const baseDetails = {
    safeAddress: safeData.address.value,
    txId,
    executedAt: isExecuted ? now - 1000 * 60 * 60 * 24 : null,
    txStatus: isExecuted ? 'SUCCESS' : isSettings ? 'AWAITING_EXECUTION' : 'AWAITING_CONFIRMATIONS',
    txHash: isExecuted ? '0x' + '1234567890abcdef'.repeat(4) : null,
    safeAppInfo: null,
    note: null,
  }

  // Build detailedExecutionInfo
  const detailedExecutionInfo = {
    type: 'MULTISIG',
    submittedAt: now - 1000 * 60 * 5,
    nonce: isSettings ? 44 : isERC20 ? 42 : 43,
    safeTxGas: '0',
    baseGas: '0',
    gasPrice: '0',
    gasToken: '0x0000000000000000000000000000000000000000',
    refundReceiver: {
      value: '0x0000000000000000000000000000000000000000',
      name: null,
      logoUri:
        'https://safe-transaction-assets.safe.global/contracts/logos/0x0000000000000000000000000000000000000000.png',
    },
    safeTxHash:
      '0x' +
      txId
        .replace(/[^a-f0-9]/gi, '0')
        .slice(0, 64)
        .padEnd(64, '0'),
    executor: isExecuted ? safeData.owners[0] : null,
    signers: safeData.owners,
    confirmationsRequired: safeData.threshold,
    confirmations: isSettings
      ? safeData.owners.slice(0, safeData.threshold).map((owner, i) => ({
          signer: owner,
          signature: mockSignature,
          submittedAt: now - 1000 * 60 * 60 * (24 - i),
        }))
      : [
          {
            signer: safeData.owners[0],
            signature: mockSignature,
            submittedAt: now - 1000 * 60 * 5,
          },
        ],
    rejectors: [],
    gasTokenInfo: null,
    trusted: true,
    proposer: safeData.owners[0],
    proposedByDelegate: null,
  }

  if (isSettings) {
    return {
      ...baseDetails,
      txInfo: {
        type: 'SettingsChange',
        humanDescription: null,
        dataDecoded: {
          method: 'addOwnerWithThreshold',
          parameters: [
            { name: 'owner', type: 'address', value: '0x9876543210987654321098765432109876543210' },
            { name: '_threshold', type: 'uint256', value: '2' },
          ],
        },
        settingsInfo: {
          type: 'ADD_OWNER',
          owner: { value: '0x9876543210987654321098765432109876543210', name: 'New Owner', logoUri: null },
          threshold: 2,
        },
      },
      txData: null,
      detailedExecutionInfo,
    }
  }

  // Transfer transaction details
  return {
    ...baseDetails,
    txInfo: {
      type: 'Transfer',
      humanDescription: null,
      sender: { value: safeData.address.value, name: null, logoUri: null },
      recipient: {
        value: '0x1234567890123456789012345678901234567890',
        name: 'vitalik.eth',
        logoUri: null,
      },
      direction: 'OUTGOING',
      transferInfo: isERC20
        ? {
            type: 'ERC20',
            tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            tokenName: 'USD Coin',
            tokenSymbol: 'USDC',
            logoUri:
              'https://safe-transaction-assets.safe.global/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.png',
            decimals: 6,
            value: '4018860000',
            trusted: true,
            imitation: false,
          }
        : {
            type: 'NATIVE_COIN',
            value: '1000000000000000',
          },
    },
    txData: null,
    detailedExecutionInfo,
  }
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
 * Mock executed transactions for history stories
 */
export function createMockHistoryTransactions(safeData: SafeState) {
  const now = Date.now()
  return {
    count: 5,
    next: null,
    previous: null,
    results: [
      {
        type: 'DATE_LABEL' as const,
        timestamp: now - 1000 * 60 * 60 * 24, // Yesterday
      },
      {
        type: 'TRANSACTION' as const,
        transaction: {
          id: 'multisig_0x123_0xexec1',
          txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          timestamp: now - 1000 * 60 * 60 * 24,
          txStatus: 'SUCCESS' as const,
          txInfo: {
            type: 'Transfer' as const,
            sender: { value: safeData.address.value, name: null, logoUri: null },
            recipient: {
              value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
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
              value: '5000000000',
            },
          },
          executionInfo: {
            type: 'MULTISIG' as const,
            nonce: 40,
            confirmationsRequired: 2,
            confirmationsSubmitted: 2,
            missingSigners: null,
          },
        },
        conflictType: 'None' as const,
      },
      {
        type: 'TRANSACTION' as const,
        transaction: {
          id: 'multisig_0x123_0xexec2',
          txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          timestamp: now - 1000 * 60 * 60 * 26,
          txStatus: 'SUCCESS' as const,
          txInfo: {
            type: 'Transfer' as const,
            sender: { value: safeData.address.value, name: null, logoUri: null },
            recipient: {
              value: '0x1234567890123456789012345678901234567890',
              name: null,
              logoUri: null,
            },
            direction: 'OUTGOING' as const,
            transferInfo: {
              type: 'NATIVE_COIN' as const,
              value: '2500000000000000000',
            },
          },
          executionInfo: {
            type: 'MULTISIG' as const,
            nonce: 39,
            confirmationsRequired: 2,
            confirmationsSubmitted: 2,
            missingSigners: null,
          },
        },
        conflictType: 'None' as const,
      },
      {
        type: 'DATE_LABEL' as const,
        timestamp: now - 1000 * 60 * 60 * 24 * 3, // 3 days ago
      },
      {
        type: 'TRANSACTION' as const,
        transaction: {
          id: 'multisig_0x123_0xexec3',
          txHash: '0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234',
          timestamp: now - 1000 * 60 * 60 * 24 * 3,
          txStatus: 'SUCCESS' as const,
          txInfo: {
            type: 'SettingsChange' as const,
            dataDecoded: {
              method: 'changeThreshold',
              parameters: [{ name: '_threshold', type: 'uint256', value: '2' }],
            },
            settingsInfo: {
              type: 'CHANGE_THRESHOLD' as const,
              threshold: 2,
            },
          },
          executionInfo: {
            type: 'MULTISIG' as const,
            nonce: 38,
            confirmationsRequired: 1,
            confirmationsSubmitted: 1,
            missingSigners: null,
          },
        },
        conflictType: 'None' as const,
      },
      {
        type: 'TRANSACTION' as const,
        transaction: {
          id: 'ethereum_0x123_0xincoming1',
          txHash: '0x890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
          timestamp: now - 1000 * 60 * 60 * 24 * 3 - 1000 * 60 * 30,
          txStatus: 'SUCCESS' as const,
          txInfo: {
            type: 'Transfer' as const,
            sender: {
              value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
              name: 'vitalik.eth',
              logoUri: null,
            },
            recipient: { value: safeData.address.value, name: null, logoUri: null },
            direction: 'INCOMING' as const,
            transferInfo: {
              type: 'ERC20' as const,
              tokenAddress: '0x6B175474E89094C44Da98b954EescdeCB5E1cFB85',
              tokenName: 'Dai Stablecoin',
              tokenSymbol: 'DAI',
              logoUri:
                'https://safe-transaction-assets.safe.global/tokens/logos/0x6B175474E89094C44Da98b954EedscdeCB5B1cFBA5.png',
              decimals: 18,
              value: '10000000000000000000000',
            },
          },
          executionInfo: null,
        },
        conflictType: 'None' as const,
      },
    ],
  }
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

  // Create history transactions
  const txHistoryData = createMockHistoryTransactions(safeData)

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
    ...txHistoryHandlers(txHistoryData),
    ...txDetailsHandlers(safeData),
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
