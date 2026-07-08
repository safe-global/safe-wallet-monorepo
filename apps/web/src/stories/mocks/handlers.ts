import { http, HttpResponse, type RequestHandler } from 'msw'
import type { Chain, IndexingStatus } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeOverview, SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { CollectiblePage } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import type { DelegatePage } from '@safe-global/store/gateway/AUTO_GENERATED/delegates'
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
import { createChainData, createChainsPageData, createChainsPageDataV2 } from './chains'
import type { FeatureFlags, MockStoryConfig } from './types'

/**
 * Core chain configuration handlers
 */
export function coreHandlers(chainData: Chain): RequestHandler[] {
  const indexingStatus: IndexingStatus = {
    currentBlockNumber: 20000000,
    currentBlockTimestamp: new Date().toISOString(),
    erc20BlockNumber: 20000000,
    erc20BlockTimestamp: new Date().toISOString(),
    erc20Synced: true,
    masterCopiesBlockNumber: 20000000,
    masterCopiesBlockTimestamp: new Date().toISOString(),
    masterCopiesSynced: true,
    synced: true,
    lastSync: Date.now(),
  }

  return [
    http.get(/\/v1\/chains\/\d+\/about\/indexing$/, () => HttpResponse.json(indexingStatus)),
    http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(chainData)),
    http.get(/\/v1\/chains$/, () => HttpResponse.json(createChainsPageData(chainData))),
    http.get(/\/v2\/chains$/, () => HttpResponse.json(createChainsPageDataV2(chainData))),
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
    // Targeted safe lookup for a specific outreach - 404 means the Safe is not targeted
    http.get(/\/v1\/targeted-messaging\/outreaches\/\d+\/chains\/\d+\/safes\/0x[a-fA-F0-9]+$/, () =>
      HttpResponse.json({ message: 'Safe not targeted' }, { status: 404 }),
    ),
    http.get(/\/v1\/targeted-messaging\/safes\/0x[a-fA-F0-9]+\/outreaches/, () =>
      HttpResponse.json({ outreaches: [] }),
    ),
  ]
}

/**
 * Supported fiat codes handler (currency selector on Balances page)
 */
export function fiatCodesHandlers(): RequestHandler[] {
  return [
    http.get(/\/v1\/balances\/supported-fiat-codes$/, () =>
      HttpResponse.json(['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'AUD', 'CAD']),
    ),
  ]
}

/**
 * Delegates handlers (proposers) - empty list by default
 */
export function delegatesHandlers(): RequestHandler[] {
  const emptyDelegatePage: DelegatePage = { count: 0, next: null, previous: null, results: [] }
  return [http.get(/\/v[12]\/chains\/\d+\/delegates$/, () => HttpResponse.json(emptyDelegatePage))]
}

/**
 * Collectibles (NFTs) handlers
 */
export function collectiblesHandlers(): RequestHandler[] {
  const collectiblesPage: CollectiblePage = {
    count: 3,
    next: null,
    previous: null,
    results: [
      {
        address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
        tokenName: 'Bored Ape Yacht Club',
        tokenSymbol: 'BAYC',
        logoUri: '',
        id: '1234',
        uri: null,
        name: 'Bored Ape #1234',
        description: 'A bored ape',
        imageUri: null,
        metadata: null,
      },
      {
        address: '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
        tokenName: 'CryptoPunks',
        tokenSymbol: 'PUNK',
        logoUri: '',
        id: '5678',
        uri: null,
        name: 'CryptoPunk #5678',
        description: 'A crypto punk',
        imageUri: null,
        metadata: null,
      },
      {
        address: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
        tokenName: 'ENS: Ethereum Name Service',
        tokenSymbol: 'ENS',
        logoUri: '',
        id: '9012',
        uri: null,
        name: 'safe-wallet.eth',
        description: 'An ENS name',
        imageUri: null,
        metadata: null,
      },
    ],
  }
  return [
    http.get(/\/v2\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/collectibles$/, () => HttpResponse.json(collectiblesPage)),
  ]
}

/**
 * Owned safes handlers (sidebar "My accounts", watchlist prompts)
 */
export function ownedSafesHandlers(): RequestHandler[] {
  return [
    http.get(/\/v1\/chains\/\d+\/owners\/0x[a-fA-F0-9]+\/safes$/, () =>
      HttpResponse.json({ safes: mockOwnedSafes['1'] }),
    ),
    http.get(/\/v2\/owners\/0x[a-fA-F0-9]+\/safes$/, () => HttpResponse.json(mockOwnedSafes)),
  ]
}

/**
 * Safe overview handlers (batch endpoint powering safe list cards / header totals).
 * Returns an overview for the current scenario Safe plus the mock owned safes.
 */
export function safeOverviewHandlers(safeData: SafeState): RequestHandler[] {
  const scenarioOverview: SafeOverview = {
    address: safeData.address,
    chainId: safeData.chainId,
    threshold: safeData.threshold,
    owners: safeData.owners,
    fiatTotal: '48250.75',
    queued: 3,
    awaitingConfirmation: 2,
  }
  const overviews = [scenarioOverview, ...mockSafeOverviews]
  return [
    http.get(/\/v1\/safes$/, () => HttpResponse.json(overviews)),
    http.get(/\/v2\/safes$/, () => HttpResponse.json(overviews)),
  ]
}

/**
 * External (non-CGW) services that pages call on load:
 * - Zodiac security-check (vulnerable modules banner) - report "safe"
 * - WalletConnect telemetry - accept and discard
 */
export function externalServicesHandlers(): RequestHandler[] {
  return [
    http.get(/zodiac-check\.safe\.global\/public\/api\/security-check/, () => HttpResponse.json({ status: 'safe' })),
    http.post(/pulse\.walletconnect\.org/, () => HttpResponse.json({})),
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
 * Mock owned safes for the onboarding flow
 */
export const mockOwnedSafes = {
  '1': ['0xA77DE01e157f9f57C7c4A326eeEaf0BDD2CFcD01', '0xB63F3D0a4a7eFd1d0c08A9ef17C5e5d3DbBDE867'],
  '137': ['0xA77DE01e157f9f57C7c4A326eeEaf0BDD2CFcD01'],
}

/**
 * Mock safe overviews for owned safes
 */
export const mockSafeOverviews = [
  {
    address: { value: '0xA77DE01e157f9f57C7c4A326eeEaf0BDD2CFcD01', name: null, logoUri: null },
    chainId: '1',
    threshold: 2,
    owners: [
      { value: '0x5eD8Cee6b63b1c6AFce3AD7c92f4fD7E1B8fAd9F', name: null, logoUri: null },
      { value: '0x1De7F5cc55653C581d1c842AD155f88cE389E0B2', name: null, logoUri: null },
      { value: '0x24BBC568dC89E4e57bAF23b759989F3D6113BBaA', name: null, logoUri: null },
    ],
    fiatTotal: '48250.75',
    queued: 1,
    awaitingConfirmation: null,
  },
  {
    address: { value: '0xB63F3D0a4a7eFd1d0c08A9ef17C5e5d3DbBDE867', name: null, logoUri: null },
    chainId: '1',
    threshold: 1,
    owners: [
      { value: '0x5eD8Cee6b63b1c6AFce3AD7c92f4fD7E1B8fAd9F', name: null, logoUri: null },
      { value: '0x26C3f6fD4f53a03eC8e54Aca0c356112cA3DDEc8', name: null, logoUri: null },
    ],
    fiatTotal: '12780.30',
    queued: 0,
    awaitingConfirmation: null,
  },
  {
    address: { value: '0xA77DE01e157f9f57C7c4A326eeEaf0BDD2CFcD01', name: null, logoUri: null },
    chainId: '137',
    threshold: 2,
    owners: [
      { value: '0x5eD8Cee6b63b1c6AFce3AD7c92f4fD7E1B8fAd9F', name: null, logoUri: null },
      { value: '0x1De7F5cc55653C581d1c842AD155f88cE389E0B2', name: null, logoUri: null },
      { value: '0x24BBC568dC89E4e57bAF23b759989F3D6113BBaA', name: null, logoUri: null },
    ],
    fiatTotal: '5430.10',
    queued: 0,
    awaitingConfirmation: null,
  },
]

/**
 * Mock space data for spaces feature
 */
export function createMockSpace(spaceId: string = 'uuid-1') {
  return {
    uuid: spaceId,
    name: 'Test Space',
    status: 'ACTIVE' as const,
    members: [
      {
        id: 1,
        role: 'ADMIN' as const,
        name: 'Admin User',
        invitedBy: null,
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
    http.get(/\/v1\/spaces\/[^/]+$/, ({ params }) => {
      const url = new URL(params[0] as string, 'https://example.com')
      const pathParts = url.pathname.split('/')
      const spaceId = pathParts[pathParts.length - 1] || 'uuid-1'
      return HttpResponse.json(createMockSpace(spaceId))
    }),
    // List all spaces for user
    http.get(/\/v1\/spaces$/, () => HttpResponse.json([createMockSpace('uuid-1')])),
    // Get space safes
    http.get(/\/v1\/spaces\/[^/]+\/safes$/, () => HttpResponse.json({ safes: {} })),
    // Get all safes owned by address (used by useOwnedSafesGrouped)
    http.get(/\/v2\/owners\/0x[a-fA-F0-9]+\/safes$/, () => HttpResponse.json(mockOwnedSafes)),
    // Safe overviews v1 (batch endpoint for safe card data)
    http.get(/\/v1\/safes$/, () => HttpResponse.json(mockSafeOverviews)),
    // Safe overviews v2 (batch endpoint for safe card data)
    http.get(/\/v2\/safes$/, () => HttpResponse.json(mockSafeOverviews)),
    // Add safes to space (mutation)
    http.post(/\/v1\/spaces\/[^/]+\/safes$/, () => HttpResponse.json({ success: true })),
    // Invite members to space (mutation)
    http.post(/\/v1\/spaces\/[^/]+\/members\/invite$/, () => HttpResponse.json({ success: true })),
    // Get space members — the gateway wraps the list in a MembersDto object
    http.get(/\/v1\/spaces\/[^/]+\/members$/, () =>
      HttpResponse.json({
        members: [
          {
            id: 1,
            role: 'ADMIN',
            name: 'Admin User',
            invitedBy: null,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            user: { id: mockUser.id, status: 'ACTIVE' },
          },
          {
            id: 2,
            role: 'MEMBER',
            name: 'Jane Member',
            invitedBy: null,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            user: { id: 2, status: 'ACTIVE' },
          },
        ],
      }),
    ),
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
            nonce: safeData.nonce ?? 0,
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
            nonce: (safeData.nonce ?? 0) + 1,
            confirmationsRequired: 2,
            confirmationsSubmitted: 1,
            missingSigners: [{ value: safeData.owners[0]?.value ?? '', name: null, logoUri: null }],
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
            nonce: (safeData.nonce ?? 0) + 2,
            confirmationsRequired: 2,
            confirmationsSubmitted: 1,
            missingSigners: [{ value: safeData.owners[0]?.value ?? '', name: null, logoUri: null }],
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
    oidcAuth: features.oidcAuth ?? false,
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

  // Fallback handlers registered after spaces so spaces-specific mocks win when enabled
  allHandlers.push(
    ...fiatCodesHandlers(),
    ...delegatesHandlers(),
    ...collectiblesHandlers(),
    ...ownedSafesHandlers(),
    ...safeOverviewHandlers(safeData),
    ...externalServicesHandlers(),
  )

  // Add custom handlers last (can override defaults)
  allHandlers.push(...customHandlers)

  return allHandlers
}
