import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import StakingTx from './index'
import { mockStakingDepositTxInfo, mockStakingExitTxInfo, mockStakingWithdrawTxInfo } from './mockData'

const meta = {
  component: StakingTx,
  decorators: [
    (Story) => {
      return (
        <StoreDecorator initialState={{}}>
          <Paper sx={{ padding: 2 }}>
            <Story />
          </Paper>
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
