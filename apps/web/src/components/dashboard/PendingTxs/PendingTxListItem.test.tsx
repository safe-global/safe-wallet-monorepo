import { render, screen } from '@/tests/test-utils'
import { DetailedExecutionInfoType } from '@safe-global/store/gateway/types'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import PendingTxListItem from './PendingTxListItem'

// Child components rely on the address book / chain config; mock them so the test
// stays focused on what PendingTxListItem itself renders (link target + signer badge).
jest.mock('@/components/transactions/TxType', () => ({
  TxTypeIcon: () => <span data-testid="tx-type-icon" />,
  TxTypeText: () => <span>Transaction Builder</span>,
}))

jest.mock('@/components/transactions/TxInfo', () => ({
  __esModule: true,
  default: () => <span>2 actions</span>,
}))

const createTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    id: 'multisig_0xabc',
    timestamp: 1705852800000,
    txStatus: 'AWAITING_CONFIRMATIONS',
    txInfo: { type: 'Custom', methodName: 'multiSend', actionCount: 2 },
    executionInfo: {
      type: DetailedExecutionInfoType.MULTISIG,
      nonce: 1,
      confirmationsRequired: 2,
      confirmationsSubmitted: 1,
      missingSigners: [],
    },
    ...overrides,
  }) as unknown as Transaction

describe('PendingTxListItem', () => {
  it('links to the transaction details with the tx id', () => {
    render(<PendingTxListItem transaction={createTransaction()} />)

    const link = screen.getByTestId('tx-pending-item')
    expect(link).toHaveAttribute('href', expect.stringContaining('/transactions/tx'))
    expect(link).toHaveAttribute('href', expect.stringContaining('multisig_0xabc'))
  })

  it('renders the type, info and signer confirmations badge', () => {
    render(<PendingTxListItem transaction={createTransaction()} />)

    expect(screen.getByText('Transaction Builder')).toBeInTheDocument()
    expect(screen.getByText('2 actions')).toBeInTheDocument()
    expect(screen.getByText('1/2')).toBeInTheDocument()
  })

  it('does not render a confirmations badge for non-multisig execution info', () => {
    render(<PendingTxListItem transaction={createTransaction({ executionInfo: undefined })} />)

    expect(screen.queryByText('1/2')).not.toBeInTheDocument()
  })
})
