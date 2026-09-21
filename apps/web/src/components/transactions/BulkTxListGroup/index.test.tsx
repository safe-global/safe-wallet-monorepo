import type { MultisigTransaction, Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import {
  ConflictType,
  DetailedExecutionInfoType,
  TransactionInfoType,
  TransactionListItemType,
  TransactionStatus,
  TransactionTokenType,
  TransferDirection,
} from '@safe-global/store/gateway/types'

import BulkTxListGroup from '@/components/transactions/BulkTxListGroup'
import { render } from '@/tests/test-utils'

const TX_HASH = '0x0000000000000000000000000000000000000000000000000000000000000abc'

const createTx = (nonce: number, id: string): MultisigTransaction => ({
  type: TransactionListItemType.TRANSACTION,
  transaction: {
    id,
    txHash: TX_HASH,
    timestamp: Date.now(),
    executionInfo: {
      type: DetailedExecutionInfoType.MULTISIG,
      nonce,
      confirmationsRequired: 1,
      confirmationsSubmitted: 1,
      missingSigners: [],
    },
    txInfo: {
      type: TransactionInfoType.TRANSFER,
      direction: TransferDirection.OUTGOING,
      transferInfo: {
        value: '1000000',
        type: TransactionTokenType.NATIVE_COIN,
      },
    },
    txStatus: TransactionStatus.SUCCESS,
  } as unknown as Transaction,
  conflictType: ConflictType.NONE,
})

describe('BulkTxListGroup', () => {
  it('renders a nonce inside every transaction row of the group', () => {
    const { getAllByTestId } = render(
      <BulkTxListGroup groupedListItems={[createTx(11, 'tx-1'), createTx(12, 'tx-2')]} transactionHash={TX_HASH} />,
    )

    expect(getAllByTestId('nonce').map((el) => el.textContent)).toEqual(['11', '12'])
  })

  it('renders the nonce within the row, not beside it', () => {
    const { getAllByTestId, getByTestId } = render(
      <BulkTxListGroup groupedListItems={[createTx(11, 'tx-1')]} transactionHash={TX_HASH} />,
    )

    expect(getByTestId('transaction-item')).toContainElement(getAllByTestId('nonce')[0])
  })

  it('renders no nonce when a transaction has no multisig execution info', () => {
    const tx = createTx(11, 'tx-1')
    const withoutExecutionInfo = {
      ...tx,
      transaction: { ...tx.transaction, executionInfo: undefined },
    } as MultisigTransaction

    const { queryByTestId } = render(
      <BulkTxListGroup groupedListItems={[withoutExecutionInfo]} transactionHash={TX_HASH} />,
    )

    expect(queryByTestId('nonce')).not.toBeInTheDocument()
  })

  it('renders nothing when the group is empty', () => {
    const { container } = render(<BulkTxListGroup groupedListItems={[]} transactionHash={TX_HASH} />)

    expect(container).toBeEmptyDOMElement()
  })
})
