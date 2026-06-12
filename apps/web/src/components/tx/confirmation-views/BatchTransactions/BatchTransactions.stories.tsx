import type { Meta, StoryObj } from '@storybook/react'
import { StoreDecorator } from '@/stories/storeDecorator'
import BatchTransactions from './index'
import { mockedDraftBatch } from './mockData'

const meta = {
  component: BatchTransactions,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => {
      return (
        <StoreDecorator
          initialState={{
            chains: { data: [{ chainId: '11155111' }] },
            batch: {
              '11155111': {
                '': [mockedDraftBatch[0], mockedDraftBatch[0]],
              },
            },
          }}
        >
          <div className="p-4">
            <Story />
          </div>
        </StoreDecorator>
      )
    },
  ],

  tags: ['autodocs'],
} satisfies Meta<typeof BatchTransactions>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
