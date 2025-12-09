import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import VaultDepositConfirmation from './index'
import { mockVaultDepositTxInfo, mockVaultDepositTxInfoWithoutAdditionalRewards } from './mockData'

const meta = {
  component: VaultDepositConfirmation,
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
  tags: ['autodocs'],
} satisfies Meta<typeof VaultDepositConfirmation>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    txInfo: mockVaultDepositTxInfo,
    isTxDetails: false,
  },
}

export const WithoutAdditionalRewards: Story = {
  args: {
    txInfo: mockVaultDepositTxInfoWithoutAdditionalRewards,
    isTxDetails: false,
  },
}

export const TxDetails: Story = {
  args: {
    txInfo: mockVaultDepositTxInfo,
    isTxDetails: true,
  },
}
