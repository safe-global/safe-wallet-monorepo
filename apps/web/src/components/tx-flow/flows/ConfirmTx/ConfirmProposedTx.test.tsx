import { faker } from '@faker-js/faker'
import { render } from '@/tests/test-utils'
import { createExistingTx } from '@/services/tx/tx-sender'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext, initialContext } from '@/components/tx-flow/TxFlowProvider'
import ConfirmProposedTx from './ConfirmProposedTx'
import { SafeScopeContext } from '@safe-global/views/components/tx-flow/safe-scope/context'
import type { SafeScopeContextValue } from '@safe-global/views/components/tx-flow/safe-scope/types'
import type Safe from '@safe-global/protocol-kit'
import { safeScopeContextFor } from '@/tests/mocks/safeScope'

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

const renderWithContexts = (safeTxContext: Partial<SafeTxContextParams>, scope?: SafeScopeContextValue) => {
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
    <SafeScopeContext.Provider value={scope}>
      <TxFlowContext.Provider value={txFlowValue}>
        <SafeTxContext.Provider value={safeTxValue}>
          <ConfirmProposedTx onSubmit={jest.fn()} />
        </SafeTxContext.Provider>
      </TxFlowContext.Provider>
    </SafeScopeContext.Provider>,
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
    expect(mockCreateExistingTx).toHaveBeenCalledWith(expect.any(String), TX_ID, undefined, undefined)
  })

  it('creates the existing tx with the SDK of the Safe scope it is opened in', () => {
    const context = safeScopeContextFor({
      chainId: faker.string.numeric(3),
      safeAddress: faker.finance.ethereumAddress(),
    })
    const scope = { ...context, scope: context.scope && { ...context.scope, sdk: {} as Safe } }

    renderWithContexts({}, scope)

    expect(mockCreateExistingTx).toHaveBeenCalledWith(expect.any(String), TX_ID, undefined, scope.scope)
  })

  it('waits for the scoped Safe SDK before creating the existing tx', () => {
    const scope = safeScopeContextFor({
      chainId: faker.string.numeric(3),
      safeAddress: faker.finance.ethereumAddress(),
    })

    renderWithContexts({}, scope)

    expect(mockCreateExistingTx).not.toHaveBeenCalled()
  })
})
