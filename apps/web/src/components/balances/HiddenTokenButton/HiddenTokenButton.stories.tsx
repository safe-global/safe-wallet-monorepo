import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { fn } from '@storybook/test'
import { StoreDecorator } from '@/stories/storeDecorator'
import HiddenTokenButton from './index'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { TokenType } from '@safe-global/store/gateway/types'

const MOCK_SAFE_ADDRESS = '0x1234567890123456789012345678901234567890'

type StoryArgs = {
  showHiddenAssets?: boolean
  toggleShowHiddenAssets?: () => void
  hiddenTokenCount?: number
}

const mockBalanceItems = [
  {
    tokenInfo: {
      type: TokenType.NATIVE_TOKEN,
      address: '0x0000000000000000000000000000000000000000',
      decimals: 18,
      symbol: 'ETH',
      name: 'Ether',
      logoUri: 'https://safe-transaction-assets.safe.global/chains/1/currency_logo.png',
    },
    balance: '1000000000000000000',
    fiatBalance: '2500.00',
    fiatConversion: '2500.00',
  },
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
    balance: '100000000000000000000',
    fiatBalance: '20.00',
    fiatConversion: '0.20',
  },
]

const createInitialState = (hiddenTokenAddresses: string[] = []) => ({
  balances: {
    data: { fiatTotal: '3520.00', items: mockBalanceItems },
    loading: false,
    loaded: true,
    error: undefined,
  },
  settings: {
    currency: 'usd',
    hiddenTokens: { '1': hiddenTokenAddresses },
    tokenList: TOKEN_LISTS.ALL,
    shortName: { copy: true, qr: true },
    theme: { darkMode: false },
    env: { tenderly: { url: '', accessToken: '' }, rpc: {} },
    signing: { onChainSigning: false, blindSigning: false },
    transactionExecution: true,
  },
  chains: {
    data: [
      {
        chainId: '1',
        chainName: 'Ethereum',
        shortName: 'eth',
        nativeCurrency: { symbol: 'ETH', decimals: 18, name: 'Ether' },
      },
    ],
  },
  safeInfo: {
    data: {
      address: { value: MOCK_SAFE_ADDRESS },
      chainId: '1',
      owners: [{ value: MOCK_SAFE_ADDRESS }],
      threshold: 1,
      deployed: true,
    },
    loading: false,
    loaded: true,
  },
})

const meta: Meta<StoryArgs> = {
  title: 'Components/Balances/HiddenTokenButton',
  component: HiddenTokenButton,
  parameters: { layout: 'centered' },
  decorators: [
    (Story, context) => {
      const hiddenCount = (context.args as StoryArgs)?.hiddenTokenCount || 0
      const hiddenAddresses = mockBalanceItems.slice(0, hiddenCount).map((item) => item.tokenInfo.address)
      return (
        <StoreDecorator initialState={createInitialState(hiddenAddresses)} context={context}>
          <Paper sx={{ padding: 2 }}>
            <Story />
          </Paper>
        </StoreDecorator>
      )
    },
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<StoryArgs>

export const NoHiddenTokens: Story = {
  args: { showHiddenAssets: false, toggleShowHiddenAssets: fn(), hiddenTokenCount: 0 },
}

export const WithHiddenTokens: Story = {
  args: { showHiddenAssets: false, toggleShowHiddenAssets: fn(), hiddenTokenCount: 2 },
}
