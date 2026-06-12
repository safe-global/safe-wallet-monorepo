import type { Meta, StoryObj } from '@storybook/react'
import { StoreDecorator } from '@/stories/storeDecorator'
import SwapOrder from './index'
import { mockSwapOrderTxInfo, mockTwapOrderTxInfo, mockSwapOrderTxData } from './mockData'

const meta = {
  component: SwapOrder,
  decorators: [
    (Story) => {
      return (
        <StoreDecorator initialState={{}}>
          <div className="rounded-lg bg-background p-4">
            <Story />
          </div>
        </StoreDecorator>
      )
    },
  ],
  // Skip visual regression tests until baseline snapshots are generated
  tags: ['autodocs', '!test'],
} satisfies Meta<typeof SwapOrder>

export default meta
type Story = StoryObj<typeof meta>

export const SwapOrderDefault: Story = {
  args: {
    txInfo: mockSwapOrderTxInfo,
    txData: mockSwapOrderTxData,
  },
}

export const TwapOrder: Story = {
  args: {
    txInfo: mockTwapOrderTxInfo,
    txData: mockSwapOrderTxData,
  },
}
