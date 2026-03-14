import type { Meta, StoryObj } from '@storybook/react'
import { PendingTxWidget } from './PendingTxWidget'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const createMockTx = (
  id: string,
  description: string,
  confirmationsSubmitted: number,
  confirmationsRequired: number,
): TransactionQueuedItem =>
  ({
    type: 'TRANSACTION',
    transaction: {
      txInfo: {
        type: 'Transfer',
        humanDescription: description,
        sender: { value: '0xaaaa567890abcdef1234567890abcdef12345678' },
        recipient: { value: '0xcccc567890abcdef1234567890abcdef12345678' },
        direction: 'OUTGOING',
        transferInfo: {
          type: 'NATIVE_COIN',
          value: '5000000000000000000',
        },
      },
      id,
      txHash: null,
      timestamp: 1705852800000,
      txStatus: 'AWAITING_CONFIRMATIONS',
      executionInfo: {
        type: 'MULTISIG',
        nonce: 1,
        confirmationsRequired,
        confirmationsSubmitted,
        missingSigners: [],
      },
      safeAppInfo: null,
    },
    conflictType: 'None',
  }) as TransactionQueuedItem

const MOCK_PENDING_TRANSACTIONS: TransactionQueuedItem[] = [
  createMockTx('1', 'Send 5 ETH', 1, 2),
  createMockTx('2', 'Send 5 ETH', 2, 2),
  createMockTx('3', 'Send 5 ETH', 1, 2),
]

const meta: Meta<typeof PendingTxWidget> = {
  component: PendingTxWidget,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: 'var(--color-background-default, #f4f4f4)', padding: '2rem' }}>
        <div style={{ maxWidth: '560px' }}>
          <Story />
        </div>
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    transactions: MOCK_PENDING_TRANSACTIONS,
    remainingCount: 14,
  },
}

export const FewTransactions: Story = {
  args: {
    transactions: MOCK_PENDING_TRANSACTIONS.slice(0, 1),
  },
}

export const Loading: Story = {
  args: {
    transactions: [],
    loading: true,
  },
}

export const Empty: Story = {
  args: {
    transactions: [],
  },
}

export const ManyPending: Story = {
  args: {
    transactions: MOCK_PENDING_TRANSACTIONS,
    remainingCount: 42,
  },
}
