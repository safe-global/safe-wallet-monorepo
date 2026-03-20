import { getTxStatus, formatTxDate, getActionableTransactions, _getTransactionsToDisplay } from './utils'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { RecoveryQueueItem } from '@/features/recovery'
import * as guards from '@/utils/transaction-guards'

jest.mock('@/utils/transaction-guards')

const mockIsMultisigExecutionInfo = guards.isMultisigExecutionInfo as unknown as jest.Mock
const mockIsSignableBy = guards.isSignableBy as jest.Mock
const mockIsExecutable = guards.isExecutable as jest.Mock

const createTxItem = (executionInfo?: Record<string, unknown>): TransactionQueuedItem => ({
  type: 'TRANSACTION',
  conflictType: 'None',
  transaction: {
    id: 'tx-1',
    txHash: null,
    timestamp: 1700000000000,
    txStatus: 'AWAITING_CONFIRMATIONS',
    txInfo: { type: 'Custom' } as TransactionQueuedItem['transaction']['txInfo'],
    executionInfo: executionInfo as TransactionQueuedItem['transaction']['executionInfo'],
  },
})

const createSafe = (nonce = 0): SafeState =>
  ({
    nonce,
    address: { value: '0x1234' },
    chainId: '1',
    threshold: 2,
    owners: [],
    implementation: { value: '0x0' },
    implementationVersionState: 'UP_TO_DATE',
  }) as SafeState

describe('getTxStatus', () => {
  afterEach(() => jest.clearAllMocks())

  it('returns empty string when execution info is not multisig', () => {
    mockIsMultisigExecutionInfo.mockReturnValue(false)
    const tx = createTxItem({ type: 'MODULE' })

    expect(getTxStatus(tx)).toBe('')
  })

  it('returns "Execution needed" when confirmations are met', () => {
    mockIsMultisigExecutionInfo.mockReturnValue(true)
    const tx = createTxItem({
      type: 'MULTISIG',
      confirmationsSubmitted: 2,
      confirmationsRequired: 2,
    })

    expect(getTxStatus(tx)).toBe('Execution needed')
  })

  it('returns "Execution needed" when confirmations exceed required', () => {
    mockIsMultisigExecutionInfo.mockReturnValue(true)
    const tx = createTxItem({
      type: 'MULTISIG',
      confirmationsSubmitted: 3,
      confirmationsRequired: 2,
    })

    expect(getTxStatus(tx)).toBe('Execution needed')
  })

  it('returns singular signature needed message', () => {
    mockIsMultisigExecutionInfo.mockReturnValue(true)
    const tx = createTxItem({
      type: 'MULTISIG',
      confirmationsSubmitted: 1,
      confirmationsRequired: 2,
    })

    expect(getTxStatus(tx)).toBe('1 signature needed')
  })

  it('returns plural signatures needed message', () => {
    mockIsMultisigExecutionInfo.mockReturnValue(true)
    const tx = createTxItem({
      type: 'MULTISIG',
      confirmationsSubmitted: 0,
      confirmationsRequired: 3,
    })

    expect(getTxStatus(tx)).toBe('3 signatures needed')
  })
})

describe('formatTxDate', () => {
  it('formats timestamp to short date', () => {
    // Jan 15, 2024 in UTC
    const timestamp = Date.UTC(2024, 0, 15, 12, 0, 0)
    const result = formatTxDate(timestamp)

    expect(result).toBe('Jan 15')
  })

  it('formats another date correctly', () => {
    const timestamp = Date.UTC(2023, 11, 25, 12, 0, 0)
    const result = formatTxDate(timestamp)

    expect(result).toBe('Dec 25')
  })
})

describe('getActionableTransactions', () => {
  afterEach(() => jest.clearAllMocks())

  const safe = createSafe()

  it('returns all transactions when no wallet address', () => {
    const txs = [createTxItem(), createTxItem()]

    expect(getActionableTransactions(txs, safe)).toEqual(txs)
  })

  it('filters transactions that are signable by the wallet', () => {
    const tx1 = createTxItem()
    const tx2 = createTxItem()
    mockIsSignableBy.mockImplementation((tx) => tx === tx1.transaction)
    mockIsExecutable.mockReturnValue(false)

    const result = getActionableTransactions([tx1, tx2], safe, '0xowner')

    expect(result).toEqual([tx1])
  })

  it('filters transactions that are executable by the wallet', () => {
    const tx1 = createTxItem()
    const tx2 = createTxItem()
    mockIsSignableBy.mockReturnValue(false)
    mockIsExecutable.mockImplementation((tx) => tx === tx2.transaction)

    const result = getActionableTransactions([tx1, tx2], safe, '0xowner')

    expect(result).toEqual([tx2])
  })

  it('returns empty array when no transactions are actionable', () => {
    mockIsSignableBy.mockReturnValue(false)
    mockIsExecutable.mockReturnValue(false)

    const result = getActionableTransactions([createTxItem()], safe, '0xowner')

    expect(result).toEqual([])
  })
})

describe('_getTransactionsToDisplay', () => {
  afterEach(() => jest.clearAllMocks())

  const safe = createSafe()
  const recoveryItem = { transactionHash: '0xrecovery' } as unknown as RecoveryQueueItem

  it('returns only recovery items when they fill maxTxs', () => {
    const recoveryQueue = [recoveryItem, recoveryItem, recoveryItem]

    const [recovery, txs] = _getTransactionsToDisplay({
      recoveryQueue,
      queue: [createTxItem()],
      safe,
      maxTxs: 3,
    })

    expect(recovery).toHaveLength(3)
    expect(txs).toHaveLength(0)
  })

  it('truncates recovery items to maxTxs', () => {
    const recoveryQueue = [recoveryItem, recoveryItem, recoveryItem, recoveryItem]

    const [recovery, txs] = _getTransactionsToDisplay({
      recoveryQueue,
      queue: [],
      safe,
      maxTxs: 2,
    })

    expect(recovery).toHaveLength(2)
    expect(txs).toHaveLength(0)
  })

  it('fills remaining slots with actionable transactions', () => {
    const tx1 = createTxItem()
    const tx2 = createTxItem()
    mockIsSignableBy.mockReturnValue(true)
    mockIsExecutable.mockReturnValue(false)

    const [recovery, txs] = _getTransactionsToDisplay({
      recoveryQueue: [recoveryItem],
      queue: [tx1, tx2],
      walletAddress: '0xowner',
      safe,
      maxTxs: 3,
    })

    expect(recovery).toHaveLength(1)
    expect(txs).toHaveLength(2)
  })

  it('falls back to full queue when no actionable transactions', () => {
    const tx1 = createTxItem()
    const tx2 = createTxItem()
    mockIsSignableBy.mockReturnValue(false)
    mockIsExecutable.mockReturnValue(false)

    const [recovery, txs] = _getTransactionsToDisplay({
      recoveryQueue: [],
      queue: [tx1, tx2],
      walletAddress: '0xowner',
      safe,
      maxTxs: 3,
    })

    expect(recovery).toHaveLength(0)
    expect(txs).toHaveLength(2)
  })

  it('uses default maxTxs of 3', () => {
    mockIsSignableBy.mockReturnValue(false)
    mockIsExecutable.mockReturnValue(false)
    const txs = Array.from({ length: 5 }, () => createTxItem())

    const [, displayedTxs] = _getTransactionsToDisplay({
      recoveryQueue: [],
      queue: txs,
      safe,
    })

    expect(displayedTxs).toHaveLength(3)
  })
})
