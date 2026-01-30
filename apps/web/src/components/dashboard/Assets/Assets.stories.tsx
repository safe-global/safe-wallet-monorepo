import type { Meta, StoryObj } from '@storybook/react'
import React, { useEffect } from 'react'
import { Box } from '@mui/material'
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
import AssetsWidget from './index'

// Create chain data without complex features
const createChainData = (options?: { disableSwap?: boolean }) => {
  const chainData = { ...chainFixtures.mainnet }
  // Remove features that require extra mocking
  // Note: NATIVE_SWAPS is kept enabled by default to show swap button (affects asset row layout)
  const disabledFeatures = ['PORTFOLIO_ENDPOINT', 'POSITIONS', 'RECOVERY', 'HYPERNATIVE']
  if (options?.disableSwap) {
    disabledFeatures.push('NATIVE_SWAPS')
  }
  chainData.features = chainData.features.filter((f: string) => !disabledFeatures.includes(f))
  return chainData
}

// Create MSW handlers for Assets widget dependencies
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
    // Balances - the main data dependency
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/balances\/[a-z]+/, () => HttpResponse.json(balancesData)),
  ]
}

const { address: MOCK_SAFE_ADDRESS, chainId: MOCK_CHAIN_ID } = SAFE_ADDRESSES.efSafe

// Mock wallet context
const mockConnectedWallet: WalletContextType = {
  connectedWallet: {
    address: MOCK_SAFE_ADDRESS,
    chainId: MOCK_CHAIN_ID,
    label: 'MetaMask',
    provider: null as never,
  },
  signer: {
    address: MOCK_SAFE_ADDRESS,
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

const meta = {
  title: 'Dashboard/AssetsWidget',
  component: AssetsWidget,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
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
          <WalletContext.Provider value={mockConnectedWallet}>
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
                <Box sx={{ p: 3 }}>
                  <Story />
                </Box>
              </StoreDecorator>
            </TxModalContext.Provider>
          </WalletContext.Provider>
        </MockSDKProvider>
      )
    },
  ],
} satisfies Meta<typeof AssetsWidget>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default AssetsWidget showing top 4 assets from EF Safe.
 * Displays token icons, names, balances, and fiat values.
 *
 * Note: Values are translated 80px right and reveal action buttons on hover.
 * Hover over a row to see the full values and action buttons.
 */
export const Default: Story = {
  loaders: [mswLoader],
}

/**
 * AssetsWidget with whale portfolio data.
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
          <WalletContext.Provider value={mockConnectedWallet}>
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
                <Box sx={{ p: 3 }}>
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
 * Empty state when Safe has no assets.
 * Shows placeholder message to deposit funds.
 */
export const NoAssets: Story = {
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
        // Chain config
        http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(createChainData())),
        http.get(/\/v1\/chains$/, () =>
          HttpResponse.json({ ...chainFixtures.all, results: [createChainData()] }),
        ),
        // Balances - delay forever to show loading state
        http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/balances\/[a-z]+/, async () => {
          await new Promise(() => {})
          return HttpResponse.json({})
        }),
      ],
    },
  },
}

/**
 * Safe Token holder with diverse portfolio (25 tokens).
 *
 * Note: Values are translated 80px right and reveal action buttons on hover.
 * Hover over a row to see the full values and action buttons.
 */
export const DiversePortfolio: Story = {
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: createHandlers('safeTokenHolder'),
    },
  },
  decorators: [
    (Story, context) => {
      const isDarkMode = context.globals?.theme === 'dark'
      const safeData = { ...safeFixtures.safeTokenHolder, deployed: true }
      const chainData = createChainData()

      return (
        <MockSDKProvider>
          <WalletContext.Provider value={mockConnectedWallet}>
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
                <Box sx={{ p: 3 }}>
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

// Create handlers with swap disabled
const createHandlersNoSwap = (scenario: 'efSafe' | 'vitalik' | 'empty' | 'spamTokens' | 'safeTokenHolder') => {
  const balancesData = balancesFixtures[scenario]
  const safeData = scenario === 'empty' ? safeFixtures.efSafe : safeFixtures[scenario]
  const chainData = createChainData({ disableSwap: true })

  return [
    http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(chainData)),
    http.get(/\/v1\/chains$/, () => HttpResponse.json({ ...chainFixtures.all, results: [chainData] })),
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+$/, () => HttpResponse.json(safeData)),
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/balances\/[a-z]+/, () => HttpResponse.json(balancesData)),
  ]
}

/**
 * AssetsWidget without swap feature enabled.
 * Demonstrates how the widget looks on chains that don't support native swaps.
 *
 * Note: Without the swap button, values may appear clipped on hover due to
 * the translateX animation having fewer buttons to offset.
 */
export const WithoutSwapFeature: Story = {
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: createHandlersNoSwap('efSafe'),
    },
  },
  decorators: [
    (Story, context) => {
      const isDarkMode = context.globals?.theme === 'dark'
      const safeData = { ...safeFixtures.efSafe, deployed: true }
      const chainData = createChainData({ disableSwap: true })

      return (
        <MockSDKProvider>
          <WalletContext.Provider value={mockConnectedWallet}>
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
                <Box sx={{ p: 3 }}>
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
