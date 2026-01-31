import type { Meta, StoryObj } from '@storybook/react'
import React, { useEffect } from 'react'
import { Paper } from '@mui/material'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { StoreDecorator } from '@/stories/storeDecorator'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { WalletContext, type WalletContextType } from '@/components/common/WalletProvider'
import { setSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { SAFE_ADDRESSES, safeFixtures, chainFixtures } from '../../../../../../config/test/msw/fixtures'
import PendingTxsList from './PendingTxsList'

// Mock transaction data for queue
const createMockQueuedTransaction = (nonce: number, confirmations: number, threshold: number) => ({
  type: 'TRANSACTION',
  transaction: {
    id: `multisig_0x${nonce.toString(16).padStart(8, '0')}`,
    timestamp: Date.now() - nonce * 3600000,
    txStatus: 'AWAITING_CONFIRMATIONS',
    txInfo: {
      type: 'Transfer',
      sender: { value: SAFE_ADDRESSES.efSafe.address },
      recipient: { value: '0x1234567890123456789012345678901234567890', name: 'Recipient' },
      direction: 'OUTGOING',
      transferInfo: {
        type: 'ERC20',
        tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        tokenName: 'USD Coin',
        tokenSymbol: 'USDC',
        logoUri:
          'https://safe-transaction-assets.safe.global/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.png',
        decimals: 6,
        value: '1000000000', // 1000 USDC
      },
    },
    executionInfo: {
      type: 'MULTISIG',
      nonce,
      confirmationsRequired: threshold,
      confirmationsSubmitted: confirmations,
      missingSigners: confirmations < threshold ? [{ value: '0xowner1111111111111111111111111111111111' }] : [],
    },
  },
  conflictType: 'None',
})

const createMockQueueResponse = (txCount: number, confirmations: number = 1, threshold: number = 2) => ({
  count: txCount,
  next: null,
  previous: null,
  results:
    txCount > 0
      ? Array.from({ length: Math.min(txCount, 4) }, (_, i) =>
          createMockQueuedTransaction(i + 1, confirmations, threshold),
        )
      : [],
})

// Create chain data without complex features
const createChainData = () => {
  const chainData = { ...chainFixtures.mainnet }
  chainData.features = chainData.features.filter(
    (f: string) => !['PORTFOLIO_ENDPOINT', 'POSITIONS', 'RECOVERY', 'HYPERNATIVE'].includes(f),
  )
  return chainData
}

// Create MSW handlers
const createHandlers = (txCount: number = 0, confirmations: number = 1, threshold: number = 2) => {
  const chainData = createChainData()

  return [
    // Chain config
    http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(chainData)),
    http.get(/\/v1\/chains$/, () => HttpResponse.json({ ...chainFixtures.all, results: [chainData] })),
    // Safe info
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+$/, () => HttpResponse.json(safeFixtures.efSafe)),
    // Transaction queue - the main data dependency
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/transactions\/queued/, () =>
      HttpResponse.json(createMockQueueResponse(txCount, confirmations, threshold)),
    ),
  ]
}

const { chainId: MOCK_CHAIN_ID } = SAFE_ADDRESSES.efSafe

// Mock wallet context - owner of the Safe
const mockConnectedWallet: WalletContextType = {
  connectedWallet: {
    address: safeFixtures.efSafe.owners[0].value, // First owner
    chainId: MOCK_CHAIN_ID,
    label: 'MetaMask',
    provider: null as never,
  },
  signer: {
    address: safeFixtures.efSafe.owners[0].value,
    chainId: MOCK_CHAIN_ID,
    provider: null,
  },
  setSignerAddress: () => {},
}

// Mock wallet for non-owner
const mockNonOwnerWallet: WalletContextType = {
  connectedWallet: {
    address: '0x9999999999999999999999999999999999999999', // Not an owner
    chainId: MOCK_CHAIN_ID,
    label: 'MetaMask',
    provider: null as never,
  },
  signer: {
    address: '0x9999999999999999999999999999999999999999',
    chainId: MOCK_CHAIN_ID,
    provider: null,
  },
  setSignerAddress: () => {},
}

// Mock SDK Provider
const MockSDKProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    setSafeSDK({} as never)
    return () => setSafeSDK(undefined)
  }, [])
  return <>{children}</>
}

const meta = {
  title: 'Dashboard/PendingTxsList',
  component: PendingTxsList,
  loaders: [mswLoader],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createHandlers(0),
    },
  },
  decorators: [
    (Story, context) => {
      const isDarkMode = context.globals?.theme === 'dark'
      const safeData = { ...safeFixtures.efSafe, deployed: true }
      const chainData = createChainData()

      return (
        <MockSDKProvider>
          <WalletContext.Provider value={mockConnectedWallet}>
            <StoreDecorator
              initialState={{
                safeInfo: {
                  data: safeData,
                  loading: false,
                  loaded: true,
                },
                chains: {
                  data: [chainData],
                  loading: false,
                },
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
              }}
            >
              <Paper sx={{ p: 2, maxWidth: 500 }}>
                <Story />
              </Paper>
            </StoreDecorator>
          </WalletContext.Provider>
        </MockSDKProvider>
      )
    },
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof PendingTxsList>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Empty state when there are no pending transactions.
 * Shows "No transactions to sign" message.
 */
export const EmptyQueue: Story = {
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: createHandlers(0),
    },
  },
}

/**
 * Single pending transaction awaiting signatures.
 */
export const SingleTransaction: Story = {
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: createHandlers(1, 1, 2), // 1 tx, 1 confirmation, 2 required
    },
  },
}

/**
 * Multiple pending transactions in the queue.
 * Shows up to 4 transactions with "View all" link.
 */
export const MultipleTransactions: Story = {
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: createHandlers(4, 1, 2), // 4 txs
    },
  },
}

/**
 * Transaction ready to execute (all confirmations gathered).
 */
export const ReadyToExecute: Story = {
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: createHandlers(2, 2, 2), // 2 txs, fully confirmed
    },
  },
}

/**
 * Loading state showing skeleton placeholder.
 */
export const Loading: Story = {
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: [
        http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(createChainData())),
        http.get(/\/v1\/chains$/, () => HttpResponse.json({ ...chainFixtures.all, results: [createChainData()] })),
        http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+$/, () => HttpResponse.json(safeFixtures.efSafe)),
        // Delay forever to show loading state
        http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/transactions\/queued/, async () => {
          await new Promise(() => {})
          return HttpResponse.json({})
        }),
      ],
    },
  },
  decorators: [
    (Story, context) => {
      const isDarkMode = context.globals?.theme === 'dark'
      const chainData = createChainData()

      return (
        <MockSDKProvider>
          <WalletContext.Provider value={mockConnectedWallet}>
            <StoreDecorator
              initialState={{
                safeInfo: {
                  data: undefined,
                  loading: true,
                  loaded: false,
                },
                chains: {
                  data: [chainData],
                  loading: false,
                },
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
              }}
            >
              <Paper sx={{ p: 2, maxWidth: 500 }}>
                <Story />
              </Paper>
            </StoreDecorator>
          </WalletContext.Provider>
        </MockSDKProvider>
      )
    },
  ],
}

/**
 * Connected as non-owner - shows all pending transactions
 * without filtering to actionable ones.
 */
export const NonOwnerView: Story = {
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: createHandlers(3, 1, 2),
    },
  },
  decorators: [
    (Story, context) => {
      const isDarkMode = context.globals?.theme === 'dark'
      const safeData = { ...safeFixtures.efSafe, deployed: true }
      const chainData = createChainData()

      return (
        <MockSDKProvider>
          <WalletContext.Provider value={mockNonOwnerWallet}>
            <StoreDecorator
              initialState={{
                safeInfo: {
                  data: safeData,
                  loading: false,
                  loaded: true,
                },
                chains: {
                  data: [chainData],
                  loading: false,
                },
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
              }}
            >
              <Paper sx={{ p: 2, maxWidth: 500 }}>
                <Story />
              </Paper>
            </StoreDecorator>
          </WalletContext.Provider>
        </MockSDKProvider>
      )
    },
  ],
}
