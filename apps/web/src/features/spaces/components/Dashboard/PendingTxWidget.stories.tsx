import type { Meta, StoryObj } from '@storybook/react'
import { PendingTxWidget } from './PendingTxWidget'
import type { PendingTransaction } from './PendingTxWidget'

const MOCK_PENDING_TRANSACTIONS: PendingTransaction[] = [
  { id: '1', label: 'Send 5 ETH', info: 'Jan 21', status: '1 signature needed' },
  { id: '2', label: 'Send 5 ETH', info: 'Jan 21', status: 'Execution needed' },
  { id: '3', label: 'Send 5 ETH', info: 'Jan 21', status: '1 signature needed' },
]

const MOCK_PENDING_TRANSACTIONS_WITH_INITIALS: PendingTransaction[] = [
  { id: '1', label: 'Send 5 ETH', info: 'Jan 21', status: '1 signature needed', initials: 'CN' },
  { id: '2', label: 'Send 5 ETH', info: 'Jan 21', status: '1 signature needed', initials: 'CN' },
  { id: '3', label: 'Send 5 ETH', info: 'Jan 21', status: '1 signature needed', initials: 'CN' },
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

export const WithInitials: Story = {
  args: {
    transactions: MOCK_PENDING_TRANSACTIONS_WITH_INITIALS,
    remainingCount: 14,
  },
}

export const Loading: Story = {
  args: {
    transactions: [],
    loading: true,
  },
}

export const ManyPending: Story = {
  args: {
    transactions: MOCK_PENDING_TRANSACTIONS,
    remainingCount: 42,
  },
}
