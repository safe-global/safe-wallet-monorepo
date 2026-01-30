import type { Meta, StoryObj } from '@storybook/react'
import React, { useEffect } from 'react'
import { Paper } from '@mui/material'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { StoreDecorator } from '@/stories/storeDecorator'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { WalletContext, type WalletContextType } from '@/components/common/WalletProvider'
import { TxModalContext, type TxModalContextType } from '@/components/tx-flow'
import { setSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import {
  SAFE_ADDRESSES,
  safeFixtures,
  chainFixtures,
  balancesFixtures,
} from '../../../../../../config/test/msw/fixtures'
import Overview from './Overview'

// Create chain data without complex features
const createChainData = () => {
  const chainData = { ...chainFixtures.mainnet }
  chainData.features = chainData.features.filter(
    (f: string) => !['PORTFOLIO_ENDPOINT', 'POSITIONS', 'RECOVERY', 'HYPERNATIVE'].includes(f),
  )
  return chainData
}

// Create MSW handlers for Overview dependencies
const createHandlers = (scenario: 'efSafe' | 'vitalik' | 'empty' | 'spamTokens' | 'safeTokenHolder') => {
  const balancesData = balancesFixtures[scenario]
  const safeData = scenario === 'empty' ? safeFixtures.efSafe : safeFixtures[scenario]
  const chainData = createChainData()

  return [
    // Chain config
    http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(chainData)),
    http.get(/\/v1\/chains$/, () => HttpResponse.json({ ...chainFixtures.all, results: [chainData] })),
    // Safe info
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+$/, () => HttpResponse.json(safeData)),
    // Balances - the main data dependency for Overview
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/balances\/[a-z]+/, () => HttpResponse.json(balancesData)),
  ]
}

const { chainId: MOCK_CHAIN_ID } = SAFE_ADDRESSES.efSafe

// Mock wallet context - no wallet connected
const mockNoWallet: WalletContextType = {
  connectedWallet: null,
  signer: null,
  setSignerAddress: () => {},
}

// Mock wallet context - wallet connected as Safe owner
const mockOwnerWallet: WalletContextType = {
  connectedWallet: {
    address: safeFixtures.efSafe.owners[0].value, // First owner of the Safe
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

// Mock TxModal context for the send button
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

const meta = {
  title: 'Dashboard/Overview',
  component: Overview,
  loaders: [mswLoader],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createHandlers('efSafe'),
    },
  },
  decorators: [
    (Story, context) => {
      const isDarkMode = context.globals?.theme === 'dark'
      const safeData = { ...safeFixtures.efSafe, deployed: true }
      const chainData = createChainData()

      return (
        <MockSDKProvider>
          <WalletContext.Provider value={mockNoWallet}>
            <TxModalContext.Provider value={mockTxModalContext}>
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
                <Paper sx={{ p: 2, maxWidth: 900 }}>
                  <Story />
                </Paper>
              </StoreDecorator>
            </TxModalContext.Provider>
          </WalletContext.Provider>
        </MockSDKProvider>
      )
    },
  ],
} satisfies Meta<typeof Overview>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default Overview widget with no wallet connected.
 * Action buttons may be disabled or show connect prompts.
 */
export const Default: Story = {
  loaders: [mswLoader],
}

/**
 * Overview with wallet connected as Safe owner.
 * All action buttons (Send, Swap, Receive) are enabled.
 */
export const WalletConnected: Story = {
  loaders: [mswLoader],
  decorators: [
    (Story, context) => {
      const isDarkMode = context.globals?.theme === 'dark'
      const safeData = { ...safeFixtures.efSafe, deployed: true }
      const chainData = createChainData()

      return (
        <MockSDKProvider>
          <WalletContext.Provider value={mockOwnerWallet}>
            <TxModalContext.Provider value={mockTxModalContext}>
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
                <Paper sx={{ p: 2, maxWidth: 900 }}>
                  <Story />
                </Paper>
              </StoreDecorator>
            </TxModalContext.Provider>
          </WalletContext.Provider>
        </MockSDKProvider>
      )
    },
  ],
}

/**
 * Overview with whale portfolio data (Vitalik's Safe).
 * Tests large balance rendering.
 */
export const WhalePortfolio: Story = {
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: createHandlers('vitalik'),
    },
  },
  decorators: [
    (Story, context) => {
      const isDarkMode = context.globals?.theme === 'dark'
      const safeData = { ...safeFixtures.vitalik, deployed: true }
      const chainData = createChainData()

      return (
        <MockSDKProvider>
          <WalletContext.Provider value={mockNoWallet}>
            <TxModalContext.Provider value={mockTxModalContext}>
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
                <Paper sx={{ p: 2, maxWidth: 900 }}>
                  <Story />
                </Paper>
              </StoreDecorator>
            </TxModalContext.Provider>
          </WalletContext.Provider>
        </MockSDKProvider>
      )
    },
  ],
}

/**
 * Overview with empty balance.
 * Send and Swap buttons are hidden when there are no assets.
 */
export const EmptyBalance: Story = {
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: createHandlers('empty'),
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
        http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/balances\/[a-z]+/, async () => {
          // Never resolve to show loading state
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
          <WalletContext.Provider value={mockNoWallet}>
            <TxModalContext.Provider value={mockTxModalContext}>
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
                <Paper sx={{ p: 2, maxWidth: 900 }}>
                  <Story />
                </Paper>
              </StoreDecorator>
            </TxModalContext.Provider>
          </WalletContext.Provider>
        </MockSDKProvider>
      )
    },
  ],
}

/**
 * Undeployed Safe state.
 * Shows token balance instead of fiat value, no action buttons.
 */
export const UndeployedSafe: Story = {
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: createHandlers('efSafe'),
    },
  },
  decorators: [
    (Story, context) => {
      const isDarkMode = context.globals?.theme === 'dark'
      const safeData = { ...safeFixtures.efSafe, deployed: false }
      const chainData = createChainData()

      return (
        <MockSDKProvider>
          <WalletContext.Provider value={mockNoWallet}>
            <TxModalContext.Provider value={mockTxModalContext}>
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
                <Paper sx={{ p: 2, maxWidth: 900 }}>
                  <Story />
                </Paper>
              </StoreDecorator>
            </TxModalContext.Provider>
          </WalletContext.Provider>
        </MockSDKProvider>
      )
    },
  ],
}
