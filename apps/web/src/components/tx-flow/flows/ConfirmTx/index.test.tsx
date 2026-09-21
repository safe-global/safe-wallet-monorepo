import { faker } from '@faker-js/faker'
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

const TX_ID = `multisig_${faker.finance.ethereumAddress()}_${faker.string.hexadecimal({ length: 8 })}`
const TX_NONCE = faker.number.int({ min: 1, max: 100000 })

const buildTxSummary = (): Transaction =>
  ({
    id: TX_ID,
    timestamp: Date.now(),
    executionInfo: {
      type: DetailedExecutionInfoType.MULTISIG,
      nonce: TX_NONCE,
      confirmationsRequired: 2,
      confirmationsSubmitted: 1,
      missingSigners: [{ value: faker.finance.ethereumAddress() }],
    },
    txInfo: {
      type: TransactionInfoType.TRANSFER,
      direction: TransferDirection.OUTGOING,
      transferInfo: {
        value: faker.string.numeric(7),
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
    const { rerender } = render(<ConfirmTxFlow txSummary={buildTxSummary()} />)
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
    expect(props.txId).toBe(TX_ID)
    expect(props.txNonce).toBe(TX_NONCE)
  })
})
