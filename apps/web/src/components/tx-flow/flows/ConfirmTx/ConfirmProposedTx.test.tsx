import { faker } from '@faker-js/faker'
import { render } from '@/tests/test-utils'
import { createExistingTx } from '@/services/tx/tx-sender'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext, initialContext } from '@/components/tx-flow/TxFlowProvider'
import ConfirmProposedTx from './ConfirmProposedTx'

jest.mock('@/services/tx/tx-sender', () => ({
  createExistingTx: jest.fn(() => Promise.resolve({})),
}))

jest.mock('@/components/tx/ReviewTransactionV2', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => <div data-testid="review-tx">{children}</div>,
}))

const mockCreateExistingTx = createExistingTx as jest.MockedFunction<typeof createExistingTx>

const TX_ID = `multisig_${faker.finance.ethereumAddress()}_${faker.string.hexadecimal({ length: 8 })}`
const TX_NONCE = faker.number.int({ min: 1, max: 100000 })

const renderWithContexts = (safeTxContext: Partial<SafeTxContextParams>) => {
  const txFlowValue = { ...initialContext, txId: TX_ID, txNonce: TX_NONCE }
  const safeTxValue: SafeTxContextParams = {
    setSafeTx: jest.fn(),
    setSafeMessage: jest.fn(),
    setSafeMessageHash: jest.fn(),
    setSafeTxError: jest.fn(),
    setNonce: jest.fn(),
    setNonceNeeded: jest.fn(),
    setSafeTxGas: jest.fn(),
    setTxOrigin: jest.fn(),
    isReadOnly: false,
    gtfPaymentMode: 'safe',
    setGtfPaymentMode: jest.fn(),
    setGtfSelectedGasToken: jest.fn(),
    ...safeTxContext,
  }

  const result = render(
    <TxFlowContext.Provider value={txFlowValue}>
      <SafeTxContext.Provider value={safeTxValue}>
        <ConfirmProposedTx onSubmit={jest.fn()} />
      </SafeTxContext.Provider>
    </TxFlowContext.Provider>,
  )

  return { ...result, safeTxValue, txFlowValue }
}

describe('ConfirmProposedTx', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sets the nonce from TxFlowContext and creates the existing tx from its txId', () => {
    const { safeTxValue } = renderWithContexts({})

    expect(safeTxValue.setNonce).toHaveBeenCalledWith(TX_NONCE)
    expect(mockCreateExistingTx).toHaveBeenCalledTimes(1)
    expect(mockCreateExistingTx).toHaveBeenCalledWith(expect.any(String), TX_ID)
  })
})
