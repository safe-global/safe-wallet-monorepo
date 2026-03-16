import { render, screen, fireEvent } from '@testing-library/react'
import PendingTxWidget from '../PendingTxWidget'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const MOCK_SAFE_ADDRESS = '0xaaaa567890abcdef1234567890abcdef12345678'
const MOCK_CHAIN_ID = '1' // Ethereum mainnet – shortName 'eth' in eip-3770 config

// ---- Module mocks ----

jest.mock('next/router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('@/features/transactions/utils', () => ({
  getTxStatus: () => 'Awaiting confirmations',
}))

jest.mock('@safe-global/utils/utils/date', () => ({
  formatTimeInWords: () => '2 hours ago',
}))

jest.mock('@/components/transactions/TxType', () => ({
  TxTypeIcon: () => <span data-testid="tx-type-icon" />,
  TxTypeText: () => <span data-testid="tx-type-text">Send</span>,
}))

jest.mock('@/components/transactions/TxInfo', () => ({
  __esModule: true,
  default: () => <span data-testid="tx-info" />,
}))

jest.mock('@/components/common/Identicon', () => ({
  __esModule: true,
  default: () => <span data-testid="identicon" />,
}))

// ---- Helpers ----

type SpacePendingTxItem = TransactionQueuedItem & { safeAddress?: string; chainId?: string }

const createMockTx = (id: string, safeAddress?: string, chainId?: string): SpacePendingTxItem => ({
  type: 'TRANSACTION',
  transaction: {
    id,
    txHash: null,
    timestamp: 1705852800000,
    txStatus: 'AWAITING_CONFIRMATIONS',
    txInfo: {
      type: 'Transfer',
      humanDescription: 'Send ETH',
      sender: { value: '0x1111' },
      recipient: { value: '0x2222' },
      direction: 'OUTGOING',
      transferInfo: { type: 'NATIVE_COIN', value: '1000000000000000000' },
    },
    executionInfo: {
      type: 'MULTISIG',
      nonce: 1,
      confirmationsRequired: 2,
      confirmationsSubmitted: 1,
      missingSigners: [],
    },
    safeAppInfo: null,
  },
  conflictType: 'None',
  safeAddress,
  chainId,
})

/** Returns only the widget-item rows (excludes the ActionButton chevron). */
const getTxRows = () => screen.getAllByRole('button').filter((el) => el.getAttribute('data-slot') === 'widget-item')

// ---- Tests ----

describe('PendingTxWidget – onItemClick callback', () => {
  it('calls onItemClick exactly once when a row is clicked', () => {
    const onItemClick = jest.fn()
    const tx = createMockTx('tx-1', MOCK_SAFE_ADDRESS, MOCK_CHAIN_ID)

    render(<PendingTxWidget transactions={[tx]} onItemClick={onItemClick} />)

    fireEvent.click(getTxRows()[0])

    expect(onItemClick).toHaveBeenCalledTimes(1)
  })

  it('calls onItemClick with the correct safeAddress and txId', () => {
    const onItemClick = jest.fn()
    const tx = createMockTx('tx-abc', MOCK_SAFE_ADDRESS, MOCK_CHAIN_ID)

    render(<PendingTxWidget transactions={[tx]} onItemClick={onItemClick} />)

    fireEvent.click(getTxRows()[0])

    expect(onItemClick).toHaveBeenCalledWith(MOCK_SAFE_ADDRESS, 'tx-abc')
  })

  it('calls onItemClick with the correct args for each distinct row', () => {
    const onItemClick = jest.fn()
    const tx1 = createMockTx('tx-1', MOCK_SAFE_ADDRESS, MOCK_CHAIN_ID)
    const tx2 = createMockTx('tx-2', '0xbbbb567890abcdef1234567890abcdef12345678', MOCK_CHAIN_ID)

    render(<PendingTxWidget transactions={[tx1, tx2]} onItemClick={onItemClick} />)

    const rows = getTxRows()
    expect(rows).toHaveLength(2)

    fireEvent.click(rows[0])
    expect(onItemClick).toHaveBeenLastCalledWith(MOCK_SAFE_ADDRESS, 'tx-1')

    fireEvent.click(rows[1])
    expect(onItemClick).toHaveBeenLastCalledWith('0xbbbb567890abcdef1234567890abcdef12345678', 'tx-2')

    expect(onItemClick).toHaveBeenCalledTimes(2)
  })

  it('does not render a clickable tx row when the tx has no safeAddress', () => {
    const onItemClick = jest.fn()
    const tx = createMockTx('tx-no-addr', undefined, MOCK_CHAIN_ID)

    render(<PendingTxWidget transactions={[tx]} onItemClick={onItemClick} />)

    // No widget-item row because onClick is undefined (href also undefined without safeAddress)
    expect(getTxRows()).toHaveLength(0)
    expect(onItemClick).not.toHaveBeenCalled()
  })

  it('renders an empty state when the transactions list is empty', () => {
    render(<PendingTxWidget transactions={[]} />)

    expect(screen.getByText('No pending transactions')).toBeInTheDocument()
    expect(getTxRows()).toHaveLength(0)
  })

  it('renders skeleton items while loading and no tx rows', () => {
    render(<PendingTxWidget transactions={[]} loading />)

    expect(screen.queryByText('No pending transactions')).not.toBeInTheDocument()
    expect(getTxRows()).toHaveLength(0)
  })
})
