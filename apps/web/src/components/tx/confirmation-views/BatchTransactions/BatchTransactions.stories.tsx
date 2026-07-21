import type { Meta, StoryObj } from '@storybook/react'
import { StoreDecorator } from '@/stories/storeDecorator'
import BatchTransactions from './index'
import { mockedDraftBatch } from './mockData'

/**
 * `BatchTransactions` is the confirmation view for a queued draft batch. It decodes the
 * batch through the Safe SDK, which is stubbed in Storybook — so this story permanently
 * shows the numbered rows in their skeleton loading treatment. That state is what is
 * exercised here (row numbering, spacing, skeleton sizing). For the decoded row content
 * see the `Features/Batching/BatchTxItem` stories (TokenTransfer, NamedContractInteraction).
 */
const meta = {
  title: 'Components/TxFlow/ConfirmationViews/BatchTransactions',
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
                // Two distinct items — duplicating one entry duplicates its React key.
                '': [mockedDraftBatch[0], mockedDraftBatch[1]],
              },
            },
          }}
        >
          {/* Match the batch sidebar's width so the rows don't collapse to min-content. */}
          <div className="w-[400px] p-4">
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

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Skeleton loading treatment: the Safe SDK that decodes the batch is stubbed in Storybook, so the numbered rows intentionally stay in their loading state.',
      },
    },
  },
}
