import type { Meta, StoryObj } from '@storybook/react'
import { PendingTxWidget } from './PendingTxWidget'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { withMockProvider } from '@/storybook/decorators'

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

const APP_LOGO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#12ff80"/></svg>',
  )

const createMockAppTx = (id: string): TransactionQueuedItem => {
  const item = createMockTx(id, '', 1, 2)
  return {
    ...item,
    transaction: {
      ...item.transaction,
      txInfo: {
        type: 'Custom',
        to: { value: '0xcccc567890abcdef1234567890abcdef12345678' },
        dataSize: '68',
        value: '0',
        methodName: 'approve',
        isCancellation: false,
      },
      safeAppInfo: { id: 1, name: 'Test app', url: 'https://example.com', logoUri: APP_LOGO },
    },
  } as TransactionQueuedItem
}

const MOCK_PENDING_TRANSACTIONS: TransactionQueuedItem[] = [
  createMockTx('1', 'Send 5 ETH', 1, 2),
  createMockTx('2', 'Send 5 ETH', 2, 2),
  createMockTx('3', 'Send 5 ETH', 1, 2),
]

const meta: Meta<typeof PendingTxWidget> = {
  title: 'Features/Spaces/PendingTxWidget',
  component: PendingTxWidget,
  tags: ['autodocs'],
  decorators: [
    withMockProvider(),
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

/** A Safe app transaction shows the app logo as its type icon */
export const WithAppLogo: Story = {
  args: {
    transactions: [createMockAppTx('4'), ...MOCK_PENDING_TRANSACTIONS.slice(0, 1)],
  },
}
