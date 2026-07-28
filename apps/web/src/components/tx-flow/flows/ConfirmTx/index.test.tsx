import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import {
  DetailedExecutionInfoType,
  TransactionInfoType,
  TransactionStatus,
  TransactionTokenType,
  TransferDirection,
} from '@safe-global/store/gateway/types'

import { render } from '@/tests/test-utils'
import ConfirmTxFlow from './index'
import ConfirmProposedTx from './ConfirmProposedTx'
import { TxFlow } from '../../TxFlow'

jest.mock('../../TxFlow', () => ({
  TxFlow: jest.fn(() => null),
}))

const mockTxFlow = TxFlow as jest.MockedFunction<typeof TxFlow>

const buildTxSummary = (): Transaction =>
  ({
    id: 'multisig_0x1000000000000000000000000000000000000001_0xabc',
    timestamp: Date.now(),
    executionInfo: {
      type: DetailedExecutionInfoType.MULTISIG,
      nonce: 7,
      confirmationsRequired: 2,
      confirmationsSubmitted: 1,
      missingSigners: [{ value: '0x6a5602335a878ADDCa4BF63a050E34946B56B5bC' }],
    },
    txInfo: {
      type: TransactionInfoType.TRANSFER,
      direction: TransferDirection.OUTGOING,
      transferInfo: {
        value: '1000000',
        type: TransactionTokenType.NATIVE_COIN,
      },
    },
    txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
  }) as unknown as Transaction

describe('ConfirmTxFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('passes a referentially stable ReviewTransactionComponent to TxFlow across re-renders', () => {
    // Regression test: an inline `(props) => <ConfirmProposedTx ... />` wrapper changes component
    // identity on every render, so React remounts the whole review step. Each remount re-runs
    // ConfirmProposedTx's effects (tx-details fetch + setSafeTx) and every mount-time gas
    // estimation/scan in the subtree — an infinite refetch/rerender loop once anything (e.g. the
    // space address book when signed in to a workspace) re-renders ConfirmTxFlow.
    const { rerender } = render(<ConfirmTxFlow txSummary={buildTxSummary()} />)
    // A fresh txSummary object forces a genuine re-render of ConfirmTxFlow
    rerender(<ConfirmTxFlow txSummary={buildTxSummary()} />)

    expect(mockTxFlow.mock.calls.length).toBeGreaterThanOrEqual(2)
    const firstProps = mockTxFlow.mock.calls[0][0]
    const lastProps = mockTxFlow.mock.calls[mockTxFlow.mock.calls.length - 1][0]

    expect(firstProps.ReviewTransactionComponent).toBe(ConfirmProposedTx)
    expect(lastProps.ReviewTransactionComponent).toBe(firstProps.ReviewTransactionComponent)
  })

  it('forwards txId and txNonce so ConfirmProposedTx can read them from TxFlowContext', () => {
    render(<ConfirmTxFlow txSummary={buildTxSummary()} />)

    const props = mockTxFlow.mock.calls[0][0]
    expect(props.txId).toBe('multisig_0x1000000000000000000000000000000000000001_0xabc')
    expect(props.txNonce).toBe(7)
  })
})
