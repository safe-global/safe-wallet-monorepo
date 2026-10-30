import { faker } from '@faker-js/faker'
import { render } from '@/tests/test-utils'
import { createExistingTx } from '@/services/tx/tx-sender'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext, initialContext } from '@/components/tx-flow/TxFlowProvider'
import { SafeScopeContext } from '@safe-global/views/components/tx-flow/safe-scope/context'
import type { SafeScope } from '@safe-global/views/components/tx-flow/safe-scope/types'
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
const CHAIN_ID = faker.string.numeric(5)

const renderWithContexts = (
  safeTxContext: Partial<SafeTxContextParams>,
  scope?: Pick<SafeScope, 'chainId' | 'safeAddress' | 'sdk'>,
) => {
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
    <SafeScopeContext.Provider
      value={
        scope && {
          scope: {
            ...scope,
            scopeKey: `${scope.chainId}:${scope.safeAddress}`,
            safeLoaded: true,
            safeLoading: false,
          },
          setScope: jest.fn(),
          clearScope: jest.fn(),
        }
      }
    >
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

  it('should load the transaction through the Safe scope, when the flow runs in one', () => {
    const safeAddress = faker.finance.ethereumAddress()
    const sdk = {} as SafeScope['sdk']
    renderWithContexts({}, { chainId: CHAIN_ID, safeAddress, sdk })

    expect(mockCreateExistingTx).toHaveBeenCalledWith(CHAIN_ID, TX_ID, undefined, {
      chainId: CHAIN_ID,
      safeAddress,
      sdk,
    })
  })

  it('should wait for the Safe SDK, when the flow runs in a Safe scope that has not loaded it yet', () => {
    renderWithContexts({}, { chainId: CHAIN_ID, safeAddress: faker.finance.ethereumAddress() })

    expect(mockCreateExistingTx).not.toHaveBeenCalled()
  })
})
