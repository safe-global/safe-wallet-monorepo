import type { Meta, StoryObj } from '@storybook/react'
import React, { useEffect } from 'react'
import { Paper } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import AssetsTable from './index'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { WalletContext, type WalletContextType } from '@/components/common/WalletProvider'
import { setSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import {
  SAFE_ADDRESSES,
  safeFixtures,
  chainFixtures,
  balancesFixtures,
  positionsFixtures,
  portfolioFixtures,
} from '../../../../../../config/test/msw/fixtures'

// Create chain data without PORTFOLIO_ENDPOINT feature for simpler balances flow
const createChainDataWithoutPortfolio = () => {
  const chainData = { ...chainFixtures.mainnet }
  // Remove PORTFOLIO_ENDPOINT to use simpler TX service balances path
  chainData.features = chainData.features.filter((f: string) => f !== 'PORTFOLIO_ENDPOINT')
  return chainData
}

// Create handlers that match any gateway URL using wildcard patterns
const createBalanceHandlers = (scenario: 'efSafe' | 'vitalik' | 'empty' | 'spamTokens' | 'safeTokenHolder') => {
  const balancesData = balancesFixtures[scenario]
  const safeData = scenario === 'empty' ? null : safeFixtures[scenario]
  const chainData = createChainDataWithoutPortfolio()
  const positionsData = positionsFixtures[scenario]
  const portfolioData = portfolioFixtures[scenario]

  return [
    // Chain config - path patterns work for any origin
    http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(chainData)),
    http.get(/\/v1\/chains$/, () => HttpResponse.json({ ...chainFixtures.all, results: [chainData] })),
    // Safe info
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+$/, () => HttpResponse.json(safeData)),
    // Balances
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/balances\/[a-z]+/, () => HttpResponse.json(balancesData)),
    // Positions
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+\/positions\/[a-z]+/, () => HttpResponse.json(positionsData)),
    // Portfolio
    http.get(/\/v1\/portfolio\/0x[a-fA-F0-9]+$/, () => HttpResponse.json(portfolioData)),
  ]
}
const { address: MOCK_SAFE_ADDRESS, chainId: MOCK_CHAIN_ID } = SAFE_ADDRESSES.efSafe

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

const MockSDKProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    setSafeSDK({} as never)
    return () => setSafeSDK(undefined)
  }, [])
  return <>{children}</>
}

const meta = {
  title: 'Components/Balances/AssetsTable',
  // Ensure MSW loader runs for docs mode
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    // MSW handlers to mock API responses
    msw: {
      handlers: createBalanceHandlers('efSafe'),
    },
  },
  decorators: [
    (Story, context) => {
      const hiddenTokens = context.args.hiddenTokens || {}
      const currency = context.args.currency || 'usd'
      // Get theme mode from Storybook's theme switcher (via globals)
      const currentTheme = context.globals?.theme || 'light'
      const isDarkMode = currentTheme === 'dark'

      // Use fixture data for safe info, with deployed: true so RTK Query fires
      const safeData = { ...safeFixtures.efSafe, deployed: true }
      const chainData = createChainDataWithoutPortfolio()

      return (
        <MockSDKProvider>
          <WalletContext.Provider value={mockConnectedWallet}>
            <StoreDecorator
              initialState={{
                settings: {
                  currency,
                  hiddenTokens,
                  tokenList: TOKEN_LISTS.ALL,
                  shortName: {
                    copy: true,
                    qr: true,
                  },
                  theme: {
                    darkMode: isDarkMode,
                  },
                  env: {
                    tenderly: {
                      url: '',
                      accessToken: '',
                    },
                    rpc: {},
                  },
                  signing: {
                    onChainSigning: false,
                    blindSigning: false,
                  },
                  transactionExecution: true,
                },
                chains: {
                  data: [chainData],
                  loading: false,
                },
                safeInfo: {
                  data: safeData,
                  loading: false,
                  loaded: true,
                },
              }}
            >
              <Paper sx={{ padding: 2, minHeight: '100vh' }}>
                <Story />
              </Paper>
            </StoreDecorator>
          </WalletContext.Provider>
        </MockSDKProvider>
      )
    },
  ],
  argTypes: {
    showHiddenAssets: {
      control: { type: 'boolean' },
      description: 'Whether to show hidden assets',
    },
    hiddenTokens: {
      control: { type: 'object' },
      description: 'Map of chainId to array of hidden token addresses',
    },
    currency: {
      control: { type: 'text' },
      description: 'Currency code for fiat values',
    },
  },
  tags: ['autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// Wrapper component to handle showHiddenAssets state
const AssetsTableWithState = ({ showHiddenAssets: initialShowHidden = false }: { showHiddenAssets?: boolean }) => {
  const [showHiddenAssets, setShowHiddenAssets] = React.useState(initialShowHidden)

  React.useEffect(() => {
    setShowHiddenAssets(initialShowHidden)
  }, [initialShowHidden])

  return <AssetsTable showHiddenAssets={showHiddenAssets} setShowHiddenAssets={setShowHiddenAssets} />
}

/**
 * Default AssetsTable with EF Safe balance data (~$4.5M, 32 tokens).
 * Data is fetched via MSW from real API fixtures.
 */
export const Default: Story = {
  render: (args) => <AssetsTableWithState showHiddenAssets={(args as any).showHiddenAssets} />,
  args: {
    showHiddenAssets: false,
    currency: 'usd',
  } as any,
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers: createBalanceHandlers('efSafe'),
    },
  },
}

/**
 * AssetsTable with Vitalik's whale portfolio (1551 tokens, $675M).
 * Tests rendering performance with large token lists.
 */
export const WhalePortfolio: Story = {
  render: (args) => <AssetsTableWithState showHiddenAssets={(args as any).showHiddenAssets} />,
  args: {
    showHiddenAssets: false,
    currency: 'usd',
  } as any,
  parameters: {
    msw: {
      handlers: createBalanceHandlers('vitalik'),
    },
  },
}

/**
 * AssetsTable with empty balance (no tokens).
 * Tests empty state UI.
 */
export const EmptyBalance: Story = {
  render: (args) => <AssetsTableWithState showHiddenAssets={(args as any).showHiddenAssets} />,
  args: {
    showHiddenAssets: false,
    currency: 'usd',
  } as any,
  parameters: {
    msw: {
      handlers: createBalanceHandlers('empty'),
    },
  },
}
