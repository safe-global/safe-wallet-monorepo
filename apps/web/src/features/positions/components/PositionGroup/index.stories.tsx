import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import { PositionGroup } from './index'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { toBeHex } from 'ethers'

const createMockPosition = (
  name: string,
  symbol: string,
  balance: string,
  fiatBalance: string,
  positionType: string = 'deposit',
  fiatChange?: string,
): Protocol['items'][0]['items'][0] => ({
  balance,
  fiatBalance,
  fiatConversion: '1.0',
  fiatBalance24hChange: fiatChange ?? null,
  position_type: positionType as Protocol['items'][0]['items'][0]['position_type'],
  tokenInfo: {
    address: toBeHex(Math.floor(Math.random() * 999999), 20),
    decimals: 18,
    logoUri: '',
    name,
    symbol,
    type: 'ERC20',
  },
})

const mockSupplyGroup: Protocol['items'][0] = {
  name: 'Supply',
  items: [
    createMockPosition('Wrapped Ether', 'WETH', '1500000000000000000', '5475.00', 'deposit', '2.5'),
    createMockPosition('USD Coin', 'USDC', '10000000000', '10000.00', 'deposit', '0.01'),
    createMockPosition('Dai Stablecoin', 'DAI', '5000000000000000000000', '5000.00', 'deposit', '-0.02'),
  ],
}

const mockBorrowGroup: Protocol['items'][0] = {
  name: 'Borrow',
  items: [
    createMockPosition('Wrapped Ether', 'WETH', '500000000000000000', '-1825.00', 'borrow', '2.5'),
    createMockPosition('USD Coin', 'USDC', '2000000000', '-2000.00', 'borrow', '0.01'),
  ],
}

const mockRewardsGroup: Protocol['items'][0] = {
  name: 'Claimable Rewards',
  items: [createMockPosition('Aave Token', 'AAVE', '10000000000000000000', '1200.00', 'claimable', '5.2')],
}

const mockStakingGroup: Protocol['items'][0] = {
  name: 'Staking',
  items: [
    createMockPosition('Lido Staked ETH', 'stETH', '2000000000000000000', '7300.00', 'staking', '2.1'),
    createMockPosition('Rocket Pool ETH', 'rETH', '1000000000000000000', '3700.00', 'staking', '2.3'),
  ],
}

const meta = {
  title: 'Features/Positions/PositionGroup',
  component: PositionGroup,
  parameters: {
    layout: 'fullscreen',
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
        <Paper sx={{ padding: 2, maxWidth: 800 }}>
          <Story />
        </Paper>
      </StoreDecorator>
    ),
  ],
  argTypes: {
    group: {
      control: { type: 'object' },
      description: 'Position group data to display',
    },
    isLast: {
      control: { type: 'boolean' },
      description: 'Whether this is the last group (removes bottom margin)',
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PositionGroup>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Supply position group (typical lending protocol supply positions).
 */
export const SupplyGroup: Story = {
  args: {
    group: mockSupplyGroup,
    isLast: false,
  },
}

/**
 * Borrow position group (typical lending protocol borrow positions).
 */
export const BorrowGroup: Story = {
  args: {
    group: mockBorrowGroup,
    isLast: false,
  },
}

/**
 * Rewards position group (claimable protocol rewards).
 */
export const RewardsGroup: Story = {
  args: {
    group: mockRewardsGroup,
    isLast: false,
  },
}

/**
 * Staking position group (liquid staking positions).
 */
export const StakingGroup: Story = {
  args: {
    group: mockStakingGroup,
    isLast: false,
  },
}

/**
 * Position group marked as last (no bottom margin).
 */
export const LastGroup: Story = {
  args: {
    group: mockSupplyGroup,
    isLast: true,
  },
}

/**
 * Single position in a group.
 */
export const SinglePosition: Story = {
  args: {
    group: {
      name: 'Vault Position',
      items: [createMockPosition('Yearn USDC Vault', 'yvUSDC', '50000000000', '50000.00', 'vault', '3.2')],
    },
    isLast: false,
  },
}
