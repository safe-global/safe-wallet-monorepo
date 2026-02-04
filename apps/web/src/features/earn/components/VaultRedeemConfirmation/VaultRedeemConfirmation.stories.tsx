import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import VaultRedeemConfirmation from './index'
import { mockVaultRedeemTxInfo, mockVaultRedeemTxInfoWithoutAdditionalRewards } from './mockData'

const meta = {
  component: VaultRedeemConfirmation,
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
  parameters: {
    visualTest: { disable: true },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof VaultRedeemConfirmation>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    txInfo: mockVaultRedeemTxInfo,
    isTxDetails: false,
  },
}

export const WithoutAdditionalRewards: Story = {
  args: {
    txInfo: mockVaultRedeemTxInfoWithoutAdditionalRewards,
    isTxDetails: false,
  },
}

export const TxDetails: Story = {
  args: {
    txInfo: mockVaultRedeemTxInfo,
    isTxDetails: true,
  },
}
