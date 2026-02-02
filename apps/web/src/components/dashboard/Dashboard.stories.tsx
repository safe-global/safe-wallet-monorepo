import type { Meta, StoryObj } from '@storybook/react'
import React, { useEffect } from 'react'
import { Box } from '@mui/material'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import {
  SAFE_ADDRESSES,
  safeFixtures,
  chainFixtures,
  balancesFixtures,
  portfolioFixtures,
  positionsFixtures,
  safeAppsFixtures,
} from '../../../../../config/test/msw/fixtures'
import { StoreDecorator } from '@/stories/storeDecorator'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { WalletContext, type WalletContextType } from '@/components/common/WalletProvider'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { setSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import PageLayout from '@/components/common/PageLayout'
import Dashboard from './index'

/**
 * Dashboard component story - renders the actual Dashboard content.
 *
 * This story tests the Dashboard component in isolation, without the app shell
 * (sidebar/header). The Dashboard includes:
 * - Overview widget with total balance and action buttons
 * - Assets widget showing top tokens
 * - Pending transactions list
 * - Explore Safe Apps widget
 *
 * Complex features (Recovery, Positions, Hypernative) are disabled via chain config
 * to simplify mocking requirements.
 */

// Create chain data without complex features that require extra mocking
const createChainData = () => {
  const chainData = { ...chainFixtures.mainnet }
  // Disable features that require complex mocking
  // Note: NATIVE_SWAPS is kept enabled to show swap button (affects asset row layout)
  chainData.features = chainData.features.filter(
    (f: string) =>
      ![
        'PORTFOLIO_ENDPOINT',
        'POSITIONS',
        'RECOVERY',
        'HYPERNATIVE',
        'EARN',
        'SPACES',
        'EURCV_BOOST',
        'NO_FEE_CAMPAIGN',
      ].includes(f),
  )
  return chainData
}

// Create chain data with PORTFOLIO_ENDPOINT and POSITIONS enabled (for WithLayout story)
const createChainDataWithFeatures = () => {
  const chainData = { ...chainFixtures.mainnet }
  // Keep PORTFOLIO_ENDPOINT and POSITIONS enabled, disable other complex features
  chainData.features = chainData.features.filter(
    (f: string) => !['RECOVERY', 'HYPERNATIVE', 'EARN', 'SPACES', 'EURCV_BOOST', 'NO_FEE_CAMPAIGN'].includes(f),
  )
  return chainData
}

// Mock pending transactions for all Dashboard stories
const mockPendingTransactions = {
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
        timestamp: Date.now() - 1000 * 60 * 5, // 5 minutes ago
        txStatus: 'AWAITING_CONFIRMATIONS' as const,
        txInfo: {
          type: 'Transfer' as const,
          sender: { value: safeFixtures.efSafe.address.value, name: null, logoUri: null },
          recipient: { value: '0x1234567890123456789012345678901234567890', name: 'vitalik.eth', logoUri: null },
          direction: 'OUTGOING' as const,
          transferInfo: {
            type: 'ERC20' as const,
            tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            tokenName: 'USD Coin',
            tokenSymbol: 'USDC',
            logoUri:
              'https://safe-transaction-assets.safe.global/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.png',
            decimals: 6,
            value: '4018860000', // 4,018.86 USDC
          },
        },
        executionInfo: {
          type: 'MULTISIG' as const,
          nonce: 42,
          confirmationsRequired: 2,
          confirmationsSubmitted: 1,
          missingSigners: [{ value: safeFixtures.efSafe.owners[1].value, name: null, logoUri: null }],
        },
      },
      conflictType: 'None' as const,
    },
    {
      type: 'TRANSACTION' as const,
      transaction: {
        id: 'multisig_0x123_0xabc2',
        txHash: null,
        timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
        txStatus: 'AWAITING_CONFIRMATIONS' as const,
        txInfo: {
          type: 'Transfer' as const,
          sender: { value: safeFixtures.efSafe.address.value, name: null, logoUri: null },
          recipient: { value: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', name: null, logoUri: null },
          direction: 'OUTGOING' as const,
          transferInfo: {
            type: 'NATIVE_COIN' as const,
            value: '1000000000000000', // 0.001 ETH
          },
        },
        executionInfo: {
          type: 'MULTISIG' as const,
          nonce: 43,
          confirmationsRequired: 2,
          confirmationsSubmitted: 1,
          missingSigners: [{ value: safeFixtures.efSafe.owners[1].value, name: null, logoUri: null }],
        },
      },
      conflictType: 'None' as const,
    },
    {
      type: 'TRANSACTION' as const,
      transaction: {
        id: 'multisig_0x123_0xabc3',
        txHash: null,
        timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
        txStatus: 'AWAITING_EXECUTION' as const,
        txInfo: {
          type: 'SettingsChange' as const,
          dataDecoded: {
            method: 'addOwnerWithThreshold',
            parameters: [
              { name: 'owner', type: 'address', value: '0x9876543210987654321098765432109876543210' },
              { name: '_threshold', type: 'uint256', value: '2' },
            ],
          },
          settingsInfo: {
            type: 'ADD_OWNER' as const,
            owner: { value: '0x9876543210987654321098765432109876543210', name: 'New Owner', logoUri: null },
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

// Create MSW handlers for Dashboard data
const createDashboardHandlers = (scenario: 'efSafe' | 'vitalik' | 'empty' | 'spamTokens' | 'safeTokenHolder') => {
  const balancesData = balancesFixtures[scenario]
  const safeData = scenario === 'empty' ? safeFixtures.efSafe : safeFixtures[scenario]
  const chainData = createChainData()
  const safeAppsData = safeAppsFixtures.mainnet

  return [
    // Chain config
    http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(chainData)),
    http.get(/\/v1\/chains$/, () => HttpResponse.json({ ...chainFixtures.all, results: [chainData] })),
    // Safe info
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+$/, () => HttpResponse.json(safeData)),
    // Balances
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/balances\/[a-z]+/, () => HttpResponse.json(balancesData)),
    // Safe Apps
    http.get(/\/v1\/chains\/\d+\/safe-apps/, () => HttpResponse.json(safeAppsData)),
    // Transaction queue (with mock pending transactions)
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/transactions\/queued/, () =>
      HttpResponse.json(mockPendingTransactions),
    ),
    // Master copies (needed for version checks)
    http.get(/\/v1\/chains\/\d+\/about\/master-copies/, () =>
      HttpResponse.json([
        { address: '0xd9Db270c1B5E3Bd161E8c8503c55cEFDDe8E6766', version: '1.3.0' },
        { address: '0x6851D6fDFAfD08c0EF60ac1b9c90E5dE6247cEAC', version: '1.4.1' },
      ]),
    ),
    // Targeted messages (Hypernative) - empty
    http.get(/\/v1\/targeted-messaging\/safes\/0x[a-fA-F0-9]+\/outreaches/, () =>
      HttpResponse.json({ outreaches: [] }),
    ),
  ]
}

const { address: MOCK_SAFE_ADDRESS, chainId: MOCK_CHAIN_ID } = SAFE_ADDRESSES.efSafe

// Mock wallet context - disconnected (for most stories)
const mockDisconnectedWallet: WalletContextType = {
  connectedWallet: null,
  signer: null,
  setSignerAddress: () => {},
}

// Mock wallet context - connected with balance (for WithLayout story)
const mockConnectedWallet: WalletContextType = {
  connectedWallet: {
    address: safeFixtures.efSafe.owners[0].value,
    chainId: MOCK_CHAIN_ID,
    label: 'MetaMask',
    provider: null as never,
    balance: '12.345',
  },
  signer: {
    address: safeFixtures.efSafe.owners[0].value,
    chainId: MOCK_CHAIN_ID,
    provider: null,
  },
  setSignerAddress: () => {},
}

// Mock TxModal context
const mockTxModalContext: TxModalContextType = {
  txFlow: undefined,
  setTxFlow: () => {},
  setFullWidth: () => {},
}

// Mock SDK Provider
const MockSDKProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    setSafeSDK({} as never)
    return () => setSafeSDK(undefined)
  }, [])
  return <>{children}</>
}

// Helper to create store initial state
const createInitialState = (
  safeData: typeof safeFixtures.efSafe,
  chainData: ReturnType<typeof createChainData>,
  isDarkMode: boolean,
  options?: { txQueue?: typeof mockPendingTransactions },
) => ({
  settings: {
    currency: 'usd',
    hiddenTokens: {},
    tokenList: TOKEN_LISTS.ALL,
    shortName: { copy: true, qr: true },
    theme: { darkMode: isDarkMode },
    env: { tenderly: { url: '', accessToken: '' }, rpc: {} },
    signing: { onChainSigning: false, blindSigning: false },
    transactionExecution: true,
  },
  chains: {
    data: [chainData],
    loading: false,
  },
  safeInfo: {
    data: { ...safeData, deployed: true },
    loading: false,
    loaded: true,
  },
  safeApps: {
    pinned: [],
  },
  ...(options?.txQueue && {
    txQueue: {
      data: options.txQueue,
      loading: false,
      error: undefined,
    },
  }),
})

// Shared decorator that provides all required context (disconnected wallet)
const createDecorator = (safeData: typeof safeFixtures.efSafe) => {
  const DashboardDecorator = (Story: React.ComponentType, context: { globals?: { theme?: string } }) => {
    const chainData = createChainData()
    const isDarkMode = context.globals?.theme === 'dark'

    return (
      <MockSDKProvider>
        <WalletContext.Provider value={mockDisconnectedWallet}>
          <TxModalContext.Provider value={mockTxModalContext}>
            <StoreDecorator
              initialState={createInitialState(safeData, chainData, isDarkMode, {
                txQueue: mockPendingTransactions,
              })}
            >
              <Box sx={{ p: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
                <Story />
              </Box>
            </StoreDecorator>
          </TxModalContext.Provider>
        </WalletContext.Provider>
      </MockSDKProvider>
    )
  }
  DashboardDecorator.displayName = 'DashboardDecorator'
  return DashboardDecorator
}

// Create MSW handlers for full layout with portfolio and positions data
const createLayoutHandlers = (scenario: 'efSafe' | 'vitalik' | 'empty' | 'spamTokens' | 'safeTokenHolder') => {
  const balancesData = balancesFixtures[scenario]
  const portfolioData = portfolioFixtures[scenario]
  const positionsData = positionsFixtures[scenario]
  const safeData = scenario === 'empty' ? safeFixtures.efSafe : safeFixtures[scenario]
  const chainData = createChainDataWithFeatures()
  const safeAppsData = safeAppsFixtures.mainnet

  return [
    // Chain config (with PORTFOLIO_ENDPOINT and POSITIONS enabled)
    http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(chainData)),
    http.get(/\/v1\/chains$/, () => HttpResponse.json({ ...chainFixtures.all, results: [chainData] })),
    // Safe info
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+$/, () => HttpResponse.json(safeData)),
    // Balances (fallback)
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/balances\/[a-z]+/, () => HttpResponse.json(balancesData)),
    // Portfolio endpoint
    http.get(/\/v1\/portfolio\/0x[a-fA-F0-9]+/, () => HttpResponse.json(portfolioData)),
    // Positions endpoint
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/positions\/[a-z]+/, () => HttpResponse.json(positionsData)),
    // Safe Apps
    http.get(/\/v1\/chains\/\d+\/safe-apps/, () => HttpResponse.json(safeAppsData)),
    // Transaction queue (with mock pending transactions)
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/transactions\/queued/, () =>
      HttpResponse.json(mockPendingTransactions),
    ),
    // Master copies (needed for version checks)
    http.get(/\/v1\/chains\/\d+\/about\/master-copies/, () =>
      HttpResponse.json([
        { address: '0xd9Db270c1B5E3Bd161E8c8503c55cEFDDe8E6766', version: '1.3.0' },
        { address: '0x6851D6fDFAfD08c0EF60ac1b9c90E5dE6247cEAC', version: '1.4.1' },
      ]),
    ),
    // Targeted messages (Hypernative) - empty
    http.get(/\/v1\/targeted-messaging\/safes\/0x[a-fA-F0-9]+\/outreaches/, () =>
      HttpResponse.json({ outreaches: [] }),
    ),
  ]
}

// Layout decorator that wraps Dashboard in full app shell (Header + Sidebar + Footer)
const createLayoutDecorator = (safeData: typeof safeFixtures.efSafe) => {
  const LayoutDecorator = (Story: React.ComponentType, context: { globals?: { theme?: string } }) => {
    const chainData = createChainDataWithFeatures()
    const isDarkMode = context.globals?.theme === 'dark'

    return (
      <MockSDKProvider>
        <WalletContext.Provider value={mockConnectedWallet}>
          <TxModalContext.Provider value={mockTxModalContext}>
            <StoreDecorator
              initialState={createInitialState(safeData, chainData, isDarkMode, {
                txQueue: mockPendingTransactions,
              })}
            >
              <PageLayout pathname="/home">
                <Story />
              </PageLayout>
            </StoreDecorator>
          </TxModalContext.Provider>
        </WalletContext.Provider>
      </MockSDKProvider>
    )
  }
  LayoutDecorator.displayName = 'LayoutDecorator'
  return LayoutDecorator
}

const meta = {
  title: 'Pages/Dashboard',
  component: Dashboard,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: createDashboardHandlers('efSafe'),
    },
    nextjs: {
      router: {
        pathname: '/home',
        query: { safe: `eth:${MOCK_SAFE_ADDRESS}` },
      },
    },
  },
  decorators: [createDecorator(safeFixtures.efSafe)],
  tags: ['autodocs'],
} satisfies Meta<typeof Dashboard>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default Dashboard with EF Safe data (~$73M total balance).
 * Shows real Overview, Assets, PendingTxs, and ExplorePossible widgets.
 */
export const Default: Story = {
  loaders: [mswLoader],
}

/**
 * Dashboard with full app layout (Header + Sidebar + Footer).
 * Shows complete page with PORTFOLIO_ENDPOINT and POSITIONS features enabled,
 * including DeFi positions widget with real fixture data. Wallet is connected.
 */
export const WithLayout: Story = {
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: createLayoutHandlers('efSafe'),
    },
  },
  decorators: [createLayoutDecorator(safeFixtures.efSafe)],
}

/**
 * Dashboard with whale portfolio data (Vitalik's Safe).
 * Tests large balance rendering.
 */
export const WhalePortfolio: Story = {
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: createDashboardHandlers('vitalik'),
    },
  },
  decorators: [createDecorator(safeFixtures.vitalik)],
}

/**
 * Dashboard for a new/empty Safe with no assets.
 * Shows empty state messaging.
 */
export const EmptyDashboard: Story = {
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: createDashboardHandlers('empty'),
    },
  },
  decorators: [createDecorator(safeFixtures.efSafe)],
}

/**
 * Dashboard at mobile viewport width (375px).
 */
export const MobileViewport: Story = {
  loaders: [mswLoader],
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
  decorators: [
    (Story, context) => {
      const chainData = createChainData()
      const isDarkMode = context.globals?.theme === 'dark'

      return (
        <MockSDKProvider>
          <WalletContext.Provider value={mockDisconnectedWallet}>
            <TxModalContext.Provider value={mockTxModalContext}>
              <StoreDecorator
                initialState={createInitialState(safeFixtures.efSafe, chainData, isDarkMode, {
                  txQueue: mockPendingTransactions,
                })}
              >
                <Box sx={{ maxWidth: 375, p: 2, backgroundColor: 'background.default', minHeight: '100vh' }}>
                  <Story />
                </Box>
              </StoreDecorator>
            </TxModalContext.Provider>
          </WalletContext.Provider>
        </MockSDKProvider>
      )
    },
  ],
}

/**
 * Dashboard at tablet viewport width (768px).
 */
export const TabletViewport: Story = {
  loaders: [mswLoader],
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  decorators: [
    (Story, context) => {
      const chainData = createChainData()
      const isDarkMode = context.globals?.theme === 'dark'

      return (
        <MockSDKProvider>
          <WalletContext.Provider value={mockDisconnectedWallet}>
            <TxModalContext.Provider value={mockTxModalContext}>
              <StoreDecorator
                initialState={createInitialState(safeFixtures.efSafe, chainData, isDarkMode, {
                  txQueue: mockPendingTransactions,
                })}
              >
                <Box sx={{ maxWidth: 768, p: 2, backgroundColor: 'background.default', minHeight: '100vh' }}>
                  <Story />
                </Box>
              </StoreDecorator>
            </TxModalContext.Provider>
          </WalletContext.Provider>
        </MockSDKProvider>
      )
    },
  ],
}

