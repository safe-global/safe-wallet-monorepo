import type { MultisigTransaction, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useEffect } from 'react'
import { userEvent } from '@testing-library/user-event'

import {
  ConflictType,
  DetailedExecutionInfoType,
  TransactionListItemType,
  TransactionStatus,
  TransactionInfoType,
  TransactionTokenType,
  TransferDirection,
} from '@safe-global/store/gateway/types'

import ExpandableTransactionItem from './ExpandableTransactionItem'
import { render } from '@/tests/test-utils'

const mockMountSpy = jest.fn()

const MockTxDetails = () => {
  useEffect(() => mockMountSpy(), [])
  return <div>Transaction details</div>
}

jest.mock('@/components/transactions/TxDetails', () => ({
  __esModule: true,
  default: () => <MockTxDetails />,
}))

const mockTransaction: MultisigTransaction = {
  type: TransactionListItemType.TRANSACTION,
  transaction: {
    id: 'multisig_0x123_0x456',
    timestamp: Date.now(),
    executionInfo: {
      type: DetailedExecutionInfoType.MULTISIG,
      nonce: 7,
      confirmationsRequired: 3,
      confirmationsSubmitted: 1,
      missingSigners: [],
    },
    txInfo: {
      type: TransactionInfoType.TRANSFER,
      direction: TransferDirection.OUTGOING,
      transferInfo: { value: '1000000', type: TransactionTokenType.NATIVE_COIN },
    },
    txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
  } as unknown as Transaction,
  conflictType: ConflictType.NONE,
}

describe('ExpandableTransactionItem', () => {
  beforeEach(() => {
    mockMountSpy.mockClear()
  })

  it('does not mount the details before the row is expanded', () => {
    const { queryByTestId } = render(<ExpandableTransactionItem item={mockTransaction} />)

    expect(queryByTestId('accordion-details')).not.toBeInTheDocument()
    expect(mockMountSpy).not.toHaveBeenCalled()
  })

  it('keeps the details mounted after collapsing so re-expanding does not refetch', async () => {
    const { getByTestId, queryByTestId } = render(<ExpandableTransactionItem item={mockTransaction} />)
    const trigger = getByTestId('transaction-item').closest('[data-slot="accordion-trigger"]')!

    await userEvent.click(trigger)
    expect(queryByTestId('accordion-details')).toBeInTheDocument()
    expect(mockMountSpy).toHaveBeenCalledTimes(1)

    await userEvent.click(trigger)
    expect(queryByTestId('accordion-details')).toBeInTheDocument()

    await userEvent.click(trigger)
    expect(mockMountSpy).toHaveBeenCalledTimes(1)
  })
})
