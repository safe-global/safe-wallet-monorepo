import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { render, screen, waitFor } from '@/tests/test-utils'
import { safeTxBuilder } from '@/tests/builders/safeTx'
import { createRejectTx } from '@/services/tx/tx-sender'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext, initialContext as initialTxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { SafeScopeContext } from '@safe-global/views/components/tx-flow/safe-scope/context'
import type { SafeScopeContextValue } from '@safe-global/views/components/tx-flow/safe-scope/types'
import type Safe from '@safe-global/protocol-kit'
import { safeScopeContextFor } from '@/tests/mocks/safeScope'
import RejectTx from './RejectTx'

jest.mock('@/services/tx/tx-sender')
jest.mock('@/components/tx/ReviewTransactionV2', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

const mockCreateRejectTx = jest.mocked(createRejectTx)

const setSafeTx = jest.fn()
const setSafeTxError = jest.fn()
const setNonce = jest.fn()

const safeTxContext: SafeTxContextParams = {
  setSafeTx,
  setSafeTxError,
  setNonce,
  setSafeMessage: jest.fn(),
  setSafeMessageHash: jest.fn(),
  setNonceNeeded: jest.fn(),
  setSafeTxGas: jest.fn(),
  setTxOrigin: jest.fn(),
  isReadOnly: false,
  gtfPaymentMode: 'safe',
  setGtfPaymentMode: jest.fn(),
  setGtfSelectedGasToken: jest.fn(),
}

const renderRejectTx = (txNonce: number | undefined, scope?: SafeScopeContextValue) =>
  render(
    <SafeScopeContext.Provider value={scope}>
      <TxFlowContext.Provider value={{ ...initialTxFlowContext, txNonce }}>
        <SafeTxContext.Provider value={safeTxContext}>
          <RejectTx onSubmit={jest.fn()} />
        </SafeTxContext.Provider>
      </TxFlowContext.Provider>
    </SafeScopeContext.Provider>,
  )

const scopeTarget = () => ({ chainId: faker.string.numeric(3), safeAddress: faker.finance.ethereumAddress() })

describe('RejectTx', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('explains that a separate rejection transaction replaces the original one', () => {
    mockCreateRejectTx.mockResolvedValue(safeTxBuilder().build())

    renderRejectTx(faker.number.int({ max: 1000 }))

    expect(
      screen.getByText(
        'To reject the transaction, a separate rejection transaction will be created to replace the original one.',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('You will need to confirm the rejection transaction with your currently connected wallet.'),
    ).toBeInTheDocument()
  })

  it('shows the nonce of the rejected transaction', () => {
    const txNonce = faker.number.int({ max: 1000 })
    mockCreateRejectTx.mockResolvedValue(safeTxBuilder().build())

    renderRejectTx(txNonce)

    expect(screen.getByText(/Transaction nonce:/)).toHaveTextContent(`Transaction nonce: ${txNonce}`)
  })

  it('builds the rejection transaction for the rejected nonce', async () => {
    const txNonce = faker.number.int({ max: 1000 })
    const rejectionTx = safeTxBuilder().build()
    mockCreateRejectTx.mockResolvedValue(rejectionTx)

    renderRejectTx(txNonce)

    expect(setNonce).toHaveBeenCalledWith(txNonce)
    expect(mockCreateRejectTx).toHaveBeenCalledWith(txNonce, undefined)
    await waitFor(() => expect(setSafeTx).toHaveBeenCalledWith(rejectionTx))
  })

  it('reports a failure to build the rejection transaction', async () => {
    const buildError = new Error('Safe SDK not initialized')
    mockCreateRejectTx.mockRejectedValue(buildError)

    renderRejectTx(faker.number.int({ max: 1000 }))

    await waitFor(() => expect(setSafeTxError).toHaveBeenCalledWith(buildError))
    expect(setSafeTx).not.toHaveBeenCalled()
  })

  it('builds nothing while the nonce is unknown', () => {
    renderRejectTx(undefined)

    expect(setNonce).not.toHaveBeenCalled()
    expect(mockCreateRejectTx).not.toHaveBeenCalled()
  })

  describe('in a Safe scope', () => {
    it('builds the rejection with the SDK of the Safe scope it is opened in', () => {
      const txNonce = faker.number.int({ max: 1000 })
      mockCreateRejectTx.mockResolvedValue(safeTxBuilder().build())
      const context = safeScopeContextFor(scopeTarget())
      const scope = { ...context, scope: context.scope && { ...context.scope, sdk: {} as Safe } }

      renderRejectTx(txNonce, scope)

      expect(mockCreateRejectTx).toHaveBeenCalledWith(txNonce, scope.scope)
    })

    it('waits for the scoped Safe SDK before building the rejection', () => {
      renderRejectTx(faker.number.int({ max: 1000 }), safeScopeContextFor(scopeTarget()))

      expect(mockCreateRejectTx).not.toHaveBeenCalled()
    })
  })
})
