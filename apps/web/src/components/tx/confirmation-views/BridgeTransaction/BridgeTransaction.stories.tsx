import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import BridgeTransaction from './index'
import { mockPendingBridgeTxInfo, mockFailedBridgeTxInfo, mockSuccessfulBridgeTxInfo } from './mockData'

const meta = {
  component: BridgeTransaction,
  decorators: [
    (Story) => {
      return (
        <StoreDecorator
          initialState={{
            chains: {
              data: [
                { chainId: '1', chainName: 'Ethereum' },
                { chainId: '10', chainName: 'Optimism' },
              ],
            },
          }}
        >
          <Paper sx={{ padding: 2 }}>
            <Story />
          </Paper>
        </StoreDecorator>
      )
    },
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof BridgeTransaction>

export default meta
type Story = StoryObj<typeof meta>

export const Pending: Story = {
  args: {
    txInfo: mockPendingBridgeTxInfo,
  },
}

export const Failed: Story = {
  args: {
    txInfo: mockFailedBridgeTxInfo,
  },
}

export const Successful: Story = {
  args: {
    txInfo: mockSuccessfulBridgeTxInfo,
  },
}
