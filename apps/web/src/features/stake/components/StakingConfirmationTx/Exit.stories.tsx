import type { Meta, StoryObj } from '@storybook/react'
import type { NativeStakingValidatorsExitTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import StakingConfirmationTxExit from './Exit'
import { StoreDecorator } from '@/stories/storeDecorator'

const ETH_TOKEN: NativeStakingValidatorsExitTransactionInfo['tokenInfo'] = {
  address: '0x0000000000000000000000000000000000000000',
  decimals: 18,
  logoUri: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  name: 'Ether',
  symbol: 'ETH',
  trusted: true,
}

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000

const baseOrder: NativeStakingValidatorsExitTransactionInfo = {
  type: 'NativeStakingValidatorsExit',
  status: 'EXIT_REQUESTED',
  estimatedExitTime: 2 * DAY_MS,
  estimatedWithdrawalTime: 1 * DAY_MS + 6 * HOUR_MS,
  value: '32000000000000000000',
  numValidators: 1,
  tokenInfo: ETH_TOKEN,
  validators: ['0xabc123'],
}

const meta = {
  component: StakingConfirmationTxExit,
  title: 'Features/Stake/StakingConfirmationTxExit',
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <StoreDecorator initialState={{}}>
        <div style={{ maxWidth: 600 }}>
          <Story />
        </div>
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof StakingConfirmationTxExit>

export default meta
type Story = StoryObj<typeof meta>

export const SingleValidator: Story = {
  args: {
    order: baseOrder,
  },
}

export const MultipleValidators: Story = {
  args: {
    order: {
      ...baseOrder,
      numValidators: 4,
      value: '128000000000000000000',
      estimatedExitTime: 5 * DAY_MS,
      estimatedWithdrawalTime: 2 * DAY_MS,
    },
  },
}
