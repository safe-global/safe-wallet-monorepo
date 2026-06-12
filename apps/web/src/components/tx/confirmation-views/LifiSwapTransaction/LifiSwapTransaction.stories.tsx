import type { Meta, StoryObj } from '@storybook/react'
import { StoreDecorator } from '@/stories/storeDecorator'
import { LifiSwapTransaction } from './index'
import { mockLifiSwapTxInfo } from './mockData'

const meta = {
  component: LifiSwapTransaction,
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
  tags: ['autodocs'],
} satisfies Meta<typeof LifiSwapTransaction>

export default meta
type Story = StoryObj<typeof meta>

export const Preview: Story = {
  args: {
    txInfo: mockLifiSwapTxInfo,
    isPreview: true,
  },
}

export const List: Story = {
  args: {
    txInfo: mockLifiSwapTxInfo,
    isPreview: false,
  },
}
