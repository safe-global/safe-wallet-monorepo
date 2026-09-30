import { render } from '@/src/tests/test-utils'
import { TxInfo } from '.'
import { mockTransactionSummary, mockTransferWithInfo } from '@/src/tests/mocks'
import { TransactionInfoType } from '@safe-global/store/gateway/types'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

describe('TxInfo', () => {
  it('renders the card with a stable per-transaction testID', () => {
    const { getByTestId } = render(<TxInfo tx={mockTransactionSummary} />)

    expect(getByTestId('tx-card-id')).toBeTruthy()
  })

  it('renders custom transactions with the per-transaction testID', () => {
    const customTx: Transaction = {
      ...mockTransactionSummary,
      id: 'multisig_0xSafe_0xHash',
      txInfo: mockTransferWithInfo({
        type: TransactionInfoType.CUSTOM,
        to: { value: '0x0000' },
      }),
    }

    const { getByTestId } = render(<TxInfo tx={customTx} />)

    expect(getByTestId('tx-card-multisig_0xSafe_0xHash')).toBeTruthy()
  })

  it('prefers an explicitly provided testID over the default', () => {
    const { getByTestId, queryByTestId } = render(<TxInfo tx={mockTransactionSummary} testID="custom-test-id" />)

    expect(getByTestId('custom-test-id')).toBeTruthy()
    expect(queryByTestId('tx-card-id')).toBeNull()
  })
})
