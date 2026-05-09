import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import { PositionGroup } from './index'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'

const WETH_LOGO = 'https://assets.coingecko.com/coins/images/2518/small/weth.png'
const USDC_LOGO = 'https://assets.coingecko.com/coins/images/6319/small/usdc.png'
const DAI_LOGO = 'https://assets.coingecko.com/coins/images/9956/small/dai-multi-collateral-mcd.png'

const mockSupplyGroup: Protocol['items'][0] = {
  name: 'Supply',
  items: [
    {
      balance: '1500000000000000000',
      fiatBalance: '5475.00',
      fiatConversion: '3650.00',
      fiatBalance24hChange: '2.5',
      position_type: 'deposit',
      tokenInfo: {
        address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        decimals: 18,
        logoUri: WETH_LOGO,
        name: 'Wrapped Ether',
        symbol: 'WETH',
        type: 'ERC20',
      },
    },
    {
      balance: '10000000000',
      fiatBalance: '10000.00',
      fiatConversion: '1.00',
      fiatBalance24hChange: '0.01',
      position_type: 'deposit',
      tokenInfo: {
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        decimals: 6,
        logoUri: USDC_LOGO,
        name: 'USD Coin',
        symbol: 'USDC',
        type: 'ERC20',
      },
    },
    {
      balance: '5000000000000000000000',
      fiatBalance: '5000.00',
      fiatConversion: '1.00',
      fiatBalance24hChange: '-0.02',
      position_type: 'deposit',
      tokenInfo: {
        address: '0x6B175474E89094C44Da98b954EedesCdB5BC64F3',
        decimals: 18,
        logoUri: DAI_LOGO,
        name: 'Dai Stablecoin',
        symbol: 'DAI',
        type: 'ERC20',
      },
    },
    {
      balance: '1000000000000000000000',
      fiatBalance: '2500.00',
      fiatConversion: '2.50',
      fiatBalance24hChange: '1.23',
      position_type: 'deposit',
      tokenInfo: {
        address: '0x1234567890123456789012345678901234567890',
        decimals: 18,
        logoUri: '',
        name: 'Unknown Token',
        symbol: 'UNK',
        type: 'ERC20',
      },
    },
  ],
}

const meta: Meta<typeof PositionGroup> = {
  title: 'Features/Positions/PositionGroup',
  component: PositionGroup,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Displays a position group with its positions in a table.',
      },
    },
  },
  decorators: [
    (Story) => (
      <StoreDecorator
        initialState={{
          settings: {
            currency: 'usd',
            hiddenTokens: {},
            shortName: { copy: true, qr: true },
            theme: {},
            env: { tenderly: { url: '', accessToken: '' }, rpc: {} },
            signing: { onChainSigning: false, blindSigning: false },
            transactionExecution: true,
          },
        }}
      >
        <Paper sx={{ padding: 2, maxWidth: 900 }}>
          <Story />
        </Paper>
      </StoreDecorator>
    ),
  ],
  // Skip visual regression tests until baseline snapshots are generated
  tags: ['autodocs', '!test'],
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Displays a position group with multiple supply positions.
 */
export const Default: Story = {
  args: {
    group: mockSupplyGroup,
    isLast: false,
  },
}
