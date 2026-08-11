import type { Meta, StoryObj } from '@storybook/react'
import { StoreDecorator } from '@/stories/storeDecorator'
import StakingTx from './index'
import { mockStakingDepositTxInfo, mockStakingExitTxInfo, mockStakingWithdrawTxInfo } from './mockData'

const meta = {
  title: 'Components/TxFlow/ConfirmationViews/StakingTx',
  component: StakingTx,
  decorators: [
    (Story) => {
      return (
        <StoreDecorator
          // The lazy StakeFeature only loads when the current chain (default: Sepolia in dev/storybook)
          // has the STAKING flag.
          initialState={{ chains: { data: [{ chainId: '11155111', chainName: 'Sepolia', features: ['STAKING'] }] } }}
        >
          <div className="rounded-lg bg-background p-4">
            <Story />
          </div>
        </StoreDecorator>
      )
    },
  ],
  // Skip visual regression tests until baseline snapshots are generated
  tags: ['autodocs', '!test'],
} satisfies Meta<typeof StakingTx>

export default meta
type Story = StoryObj<typeof meta>

export const Deposit: Story = {
  args: {
    txInfo: mockStakingDepositTxInfo,
  },
}

export const Exit: Story = {
  args: {
    txInfo: mockStakingExitTxInfo,
  },
}

export const Withdraw: Story = {
  args: {
    txInfo: mockStakingWithdrawTxInfo,
  },
}
