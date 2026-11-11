import type { Meta, StoryObj } from '@storybook/react'
import { within } from 'storybook/test'
import { StoreDecorator } from '@/stories/storeDecorator'
import SwapOrder from './index'
import { mockSwapOrderTxInfo, mockTwapOrderTxInfo, mockSwapOrderTxData } from './mockData'

const meta = {
  title: 'Components/TxFlow/ConfirmationViews/SwapOrder',
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
  // The swap feature loads lazily and renders nothing until it arrives
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Order details', undefined, { timeout: 10_000 })
  },
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
