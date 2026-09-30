import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { OperationType } from '@safe-global/types-kit'
import { createMockStory } from '@/stories/mocks'
import type { DraftBatchItem } from '../../store/batchSlice'
import BatchTxList from './BatchTxList'

/**
 * `BatchTxList` renders the queued draft transactions inside the batch sidebar.
 *
 * It builds a Safe transaction from the queued items and decodes it via the
 * transaction-preview endpoint. Until the decoded data resolves, each numbered
 * row shows a skeleton placeholder — which is the state exercised here, since
 * decoding depends on a live Safe SDK that is stubbed in Storybook. These
 * stories are therefore useful for validating the numbered-row layout, spacing
 * between rows, and the skeleton loading treatment.
 */

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  shadcn: true,
})

const meta = {
  title: 'Features/Batching/BatchTxList',
  component: BatchTxList,
  loaders: [mswLoader],
  decorators: [setup.decorator],
  parameters: {
    layout: 'padded',
    ...setup.parameters,
  },
} satisfies Meta<typeof BatchTxList>

export default meta

type Story = StoryObj<typeof meta>

const draftItem = (overrides: Partial<DraftBatchItem> & Pick<DraftBatchItem, 'id'>): DraftBatchItem => ({
  timestamp: Date.now(),
  txData: {
    to: '0x1c8b9B111C97Ed26088c8b6bC0000000cAfE0001',
    value: '0',
    data: '0xa9059cbb',
    operation: OperationType.Call,
  },
  ...overrides,
})

export const SingleTransaction: Story = {
  args: {
    txItems: [draftItem({ id: 'tx-1' })],
    onDelete: () => {},
  },
}

export const MultipleTransactions: Story = {
  args: {
    txItems: [
      draftItem({ id: 'tx-1' }),
      draftItem({
        id: 'tx-2',
        txData: {
          to: '0x2c8b9B111C97Ed26088c8b6bC0000000cAfE0002',
          value: '1000000000000000000',
          data: '0x',
          operation: OperationType.Call,
        },
      }),
      draftItem({
        id: 'tx-3',
        txData: {
          to: '0x3c8b9B111C97Ed26088c8b6bC0000000cAfE0003',
          value: '0',
          data: '0x095ea7b3',
          operation: OperationType.Call,
        },
      }),
    ],
    onDelete: () => {},
  },
}

export const ReadOnly: Story = {
  args: {
    txItems: [draftItem({ id: 'tx-1' }), draftItem({ id: 'tx-2' })],
    onDelete: undefined,
  },
}
