import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import TotalAssetValue from './index'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { TokenType } from '@safe-global/store/gateway/types'

const MOCK_SAFE_ADDRESS = '0x1234567890123456789012345678901234567890'

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
]

const createInitialState = (deployed = true) => ({
  balances: {
    data: { fiatTotal: '142567.89', items: mockBalanceItems },
    loading: false,
    loaded: true,
    error: undefined,
  },
  settings: {
    currency: 'usd',
    hiddenTokens: {},
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
      deployed,
      nonce: 0,
    },
    loading: false,
    loaded: true,
  },
})

const meta: Meta<typeof TotalAssetValue> = {
  title: 'Components/Balances/TotalAssetValue',
  component: TotalAssetValue,
  parameters: { layout: 'centered' },
  decorators: [
    (Story, context) => {
      const deployed = context.args?.fiatTotal !== undefined
      return (
        <StoreDecorator initialState={createInitialState(deployed)} context={context}>
          <Paper sx={{ padding: 3, minWidth: 300 }}>
            <Story />
          </Paper>
        </StoreDecorator>
      )
    },
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { fiatTotal: '142567.89', title: 'Total value' },
}

export const Loading: Story = {
  args: { fiatTotal: undefined, title: 'Total value' },
}
