import type { Meta, StoryObj } from '@storybook/react'
import React, { useEffect } from 'react'
import { Paper } from '@mui/material'
import { faker } from '@faker-js/faker'
import { StoreDecorator } from '@/stories/storeDecorator'
import AssetsTable from './index'
import { TokenType } from '@safe-global/store/gateway/types'
import { type Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { toBeHex } from 'ethers'
import { safeParseUnits } from '@safe-global/utils/utils/formatters'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { WalletContext, type WalletContextType } from '@/components/common/WalletProvider'
import { setSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'

const MOCK_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890'

const mockConnectedWallet: WalletContextType = {
  connectedWallet: {
    address: MOCK_WALLET_ADDRESS,
    chainId: '1',
    label: 'MetaMask',
    provider: null as never,
  },
  signer: {
    address: MOCK_WALLET_ADDRESS,
    chainId: '1',
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

// Helper function to create mock balance items
const createMockBalanceItem = (
  symbol: string,
  name: string,
  balance: string,
  fiatBalance: string,
  fiatConversion: string,
  tokenType: TokenType = TokenType.ERC20,
  decimals: number = 18,
  fiatBalance24hChange?: string,
) => ({
  balance,
  fiatBalance,
  fiatConversion,
  fiatBalance24hChange,
  tokenInfo: {
    address:
      tokenType === TokenType.NATIVE_TOKEN
        ? '0x0000000000000000000000000000000000000000'
        : toBeHex(faker.number.int({ min: 100, max: 999999 }), 20),
    decimals,
    logoUri: undefined,
    name,
    symbol,
    type: tokenType,
  },
})

// Default mock balances - based on real portfolio data (first 10 items)
const defaultMockBalances: Balances = {
  fiatTotal: '848.8596167251792',
  items: [
    {
      tokenInfo: {
        type: TokenType.ERC20,
        address: '0x5aFE3855358E112B5647B952709E6165e1c1eEEe',
        decimals: 18,
        symbol: 'SAFE',
        name: 'Safe Token',
        logoUri:
          'https://safe-transaction-assets.safe.global/tokens/logos/0x5aFE3855358E112B5647B952709E6165e1c1eEEe.png',
      },
      balance: '3178195646939569682462',
      fiatBalance: '651.9718768175363',
      fiatBalance24hChange: '-11.07249681025938',
      fiatConversion: '0.205139',
    },
    {
      tokenInfo: {
        type: TokenType.ERC20,
        address: '0x856c4Efb76C1D1AE02e20CEB03A2A6a08b0b8dC3',
        decimals: 18,
        symbol: 'OETH',
        name: 'Origin Ether',
        logoUri: 'https://assets.smold.app/api/token/1/0x856c4Efb76C1D1AE02e20CEB03A2A6a08b0b8dC3/logo-128.png',
      },
      balance: '18495233681377641',
      fiatBalance: '67.65445509245853',
      fiatBalance24hChange: '-5.274269119507757',
      fiatConversion: '3657.94',
    },
    {
      tokenInfo: {
        type: TokenType.NATIVE_TOKEN,
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        symbol: 'ETH',
        name: 'Ether',
        logoUri: 'https://safe-transaction-assets.safe.global/chains/1/currency_logo.png',
      },
      balance: '6531164837932532',
      fiatBalance: '23.904977669910377',
      fiatBalance24hChange: '-5.079858199077049',
      fiatConversion: '3660.14',
    },
    {
      tokenInfo: {
        type: TokenType.ERC20,
        address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        decimals: 18,
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        logoUri:
          'https://safe-transaction-assets.safe.global/tokens/logos/0x6B175474E89094C44Da98b954EedeAC495271d0F.png',
      },
      balance: '15846784240466027837',
      fiatBalance: '15.841887584135725',
      fiatBalance24hChange: '0.014055063200766053',
      fiatConversion: '0.999691',
    },
    {
      tokenInfo: {
        type: TokenType.ERC20,
        address: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3',
        decimals: 18,
        symbol: 'USDe',
        name: 'USDe',
        logoUri: 'https://assets.smold.app/api/token/1/0x4c9EDD5852cd905f086C759E8383e09bff1E68B3/logo-128.png',
      },
      balance: '11789399628672198943',
      fiatBalance: '11.775511715909621',
      fiatBalance24hChange: '-0.018283758158047152',
      fiatConversion: '0.998822',
    },
    {
      tokenInfo: {
        type: TokenType.ERC20,
        address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
        decimals: 18,
        symbol: 'UNI',
        name: 'Uniswap',
        logoUri: 'https://assets.smold.app/api/token/1/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo-128.png',
      },
      balance: '2070100000000000000',
      fiatBalance: '10.950829',
      fiatBalance24hChange: '-8.286348559007562',
      fiatConversion: '5.29',
    },
    {
      tokenInfo: {
        type: TokenType.ERC20,
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        decimals: 18,
        symbol: 'WETH',
        name: 'Wrapped Ether',
        logoUri: 'https://assets.smold.app/api/token/1/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo-128.png',
      },
      balance: '2654683857089670',
      fiatBalance: '9.71874450712814',
      fiatBalance24hChange: '-5.113039631828937',
      fiatConversion: '3660.98',
    },
    {
      tokenInfo: {
        type: TokenType.ERC20,
        address: '0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643',
        decimals: 8,
        symbol: 'CDAI',
        name: 'cDAI',
        logoUri: 'https://assets.coingecko.com/coins/images/9281/thumb/cDAI.png?1696509390',
      },
      balance: '32825466954',
      fiatBalance: '8.203625812009342',
      fiatBalance24hChange: '-0.025918097491514636',
      fiatConversion: '0.02499165',
    },
    {
      tokenInfo: {
        type: TokenType.ERC20,
        address: '0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5',
        decimals: 8,
        symbol: 'CETH',
        name: 'cETH',
        logoUri: 'https://assets.coingecko.com/coins/images/10643/thumb/ceth.png?1696510617',
      },
      balance: '9994054',
      fiatBalance: '7.3426314738',
      fiatBalance24hChange: '-5.3420606116037535',
      fiatConversion: '73.47',
    },
    {
      tokenInfo: {
        type: TokenType.ERC20,
        address: '0xFAe103DC9cf190eD75350761e95403b7b8aFa6c0',
        decimals: 18,
        symbol: 'rswETH',
        name: 'rswETH',
        logoUri: 'https://assets.smold.app/api/token/1/0xFAe103DC9cf190eD75350761e95403b7b8aFa6c0/logo-128.png',
      },
      balance: '1450228046517161',
      fiatBalance: '5.514941717575924',
      fiatBalance24hChange: '-1.920999678709109',
      fiatConversion: '3802.81',
    },
  ],
}

const meta = {
  title: 'Components/Balances/AssetsTable',
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story, context) => {
      const mockBalances = context.args.mockBalances || defaultMockBalances
      const chainId = context.args.chainId || '1'
      const hiddenTokens = context.args.hiddenTokens || {}
      const isLoading = context.args.isLoading || false
      const currency = context.args.currency || 'usd'
      // Get theme mode from Storybook's theme switcher (via globals)
      const currentTheme = context.globals?.theme || 'light'
      const isDarkMode = currentTheme === 'dark'

      return (
        <MockSDKProvider>
          <WalletContext.Provider value={mockConnectedWallet}>
            <StoreDecorator
              initialState={{
                balances: {
                  data: mockBalances,
                  loading: isLoading,
                  loaded: !isLoading,
                  error: undefined,
                },
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
                  data: [{ chainId }],
                },
                safeInfo: {
                  data: {
                    address: { value: MOCK_WALLET_ADDRESS },
                    chainId,
                    owners: [{ value: MOCK_WALLET_ADDRESS }],
                    threshold: 1,
                    deployed: true,
                  },
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
    mockBalances: {
      control: { type: 'object' },
      description: 'Mock balance data to display',
    },
    isLoading: {
      control: { type: 'boolean' },
      description: 'Whether balances are loading',
    },
    hiddenTokens: {
      control: { type: 'object' },
      description: 'Map of chainId to array of hidden token addresses',
    },
    chainId: {
      control: { type: 'text' },
      description: 'Chain ID',
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

/**
 * Default AssetsTable with sample balance data.
 * You can tweak the state using the controls panel to see different scenarios.
 */
export const Default: Story = {
  render: (args: any) => {
    const [showHiddenAssets, setShowHiddenAssets] = React.useState(args.showHiddenAssets || false)

    React.useEffect(() => {
      setShowHiddenAssets(args.showHiddenAssets || false)
    }, [args.showHiddenAssets])

    return <AssetsTable showHiddenAssets={showHiddenAssets} setShowHiddenAssets={setShowHiddenAssets} />
  },
  args: {
    showHiddenAssets: false,
    isLoading: false,
    chainId: '1',
    currency: 'usd',
  } as any,
}

/**
 * AssetsTable with loading state (skeletons).
 */
export const Loading: Story = {
  render: (args: any) => {
    const [showHiddenAssets, setShowHiddenAssets] = React.useState(args.showHiddenAssets || false)

    React.useEffect(() => {
      setShowHiddenAssets(args.showHiddenAssets || false)
    }, [args.showHiddenAssets])

    return <AssetsTable showHiddenAssets={showHiddenAssets} setShowHiddenAssets={setShowHiddenAssets} />
  },
  args: {
    showHiddenAssets: false,
    isLoading: true,
    chainId: '1',
    currency: 'usd',
  } as any,
}

/**
 * AssetsTable showing hidden assets with checkboxes to unhide them.
 */
export const ShowHiddenAssets: Story = {
  render: (args: any) => {
    const [showHiddenAssets, setShowHiddenAssets] = React.useState(args.showHiddenAssets ?? true)

    React.useEffect(() => {
      setShowHiddenAssets(args.showHiddenAssets ?? true)
    }, [args.showHiddenAssets])

    return <AssetsTable showHiddenAssets={showHiddenAssets} setShowHiddenAssets={setShowHiddenAssets} />
  },
  args: {
    showHiddenAssets: true,
    isLoading: false,
    chainId: '1',
    currency: 'usd',
    hiddenTokens: {
      '1': [defaultMockBalances.items[2].tokenInfo.address, defaultMockBalances.items[4].tokenInfo.address],
    },
  } as any,
}

/**
 * AssetsTable with many tokens.
 */
export const ManyTokens: Story = {
  render: (args: any) => {
    const [showHiddenAssets, setShowHiddenAssets] = React.useState(args.showHiddenAssets || false)

    React.useEffect(() => {
      setShowHiddenAssets(args.showHiddenAssets || false)
    }, [args.showHiddenAssets])

    return <AssetsTable showHiddenAssets={showHiddenAssets} setShowHiddenAssets={setShowHiddenAssets} />
  },
  args: {
    showHiddenAssets: false,
    isLoading: false,
    chainId: '1',
    currency: 'usd',
    mockBalances: {
      fiatTotal: '5000.00',
      items: [
        ...defaultMockBalances.items,
        createMockBalanceItem(
          'WBTC',
          'Wrapped Bitcoin',
          safeParseUnits('0.5', 8)!.toString(),
          '25000.00',
          '50000.00',
          TokenType.ERC20,
          8,
        ),
        createMockBalanceItem(
          'LINK',
          'Chainlink',
          safeParseUnits('100', 18)!.toString(),
          '1500.00',
          '15.00',
          TokenType.ERC20,
          18,
          '+8.3%',
        ),
        createMockBalanceItem(
          'AAVE',
          'Aave Token',
          safeParseUnits('20', 18)!.toString(),
          '1200.00',
          '60.00',
          TokenType.ERC20,
          18,
        ),
        createMockBalanceItem(
          'MKR',
          'Maker',
          safeParseUnits('5', 18)!.toString(),
          '4000.00',
          '800.00',
          TokenType.ERC20,
          18,
          '-2.1%',
        ),
        createMockBalanceItem(
          'SNX',
          'Synthetix Network Token',
          safeParseUnits('200', 18)!.toString(),
          '400.00',
          '2.00',
          TokenType.ERC20,
          18,
        ),
      ],
    },
  } as any,
}

/**
 * AssetsTable with empty balance (only native token with 0 balance).
 */
export const EmptyBalance: Story = {
  render: (args: any) => {
    const [showHiddenAssets, setShowHiddenAssets] = React.useState(args.showHiddenAssets || false)

    React.useEffect(() => {
      setShowHiddenAssets(args.showHiddenAssets || false)
    }, [args.showHiddenAssets])

    return <AssetsTable showHiddenAssets={showHiddenAssets} setShowHiddenAssets={setShowHiddenAssets} />
  },
  args: {
    showHiddenAssets: false,
    isLoading: false,
    chainId: '1',
    currency: 'usd',
    mockBalances: {
      fiatTotal: '0',
      items: [
        {
          balance: '0',
          fiatBalance: '0',
          fiatConversion: '0',
          tokenInfo: {
            address: '0x0000000000000000000000000000000000000000',
            decimals: 18,
            logoUri: undefined,
            name: 'Ethereum',
            symbol: 'ETH',
            type: TokenType.NATIVE_TOKEN,
          },
        },
      ],
    },
  } as any,
}
