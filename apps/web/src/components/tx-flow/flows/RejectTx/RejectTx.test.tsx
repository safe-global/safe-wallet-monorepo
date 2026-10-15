import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { render, screen, waitFor } from '@/tests/test-utils'
import { safeTxBuilder } from '@/tests/builders/safeTx'
import { createRejectTx } from '@/services/tx/tx-sender'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { TxFlowContext, initialContext as initialTxFlowContext } from '@/components/tx-flow/TxFlowProvider'
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

const renderRejectTx = (txNonce: number | undefined) =>
  render(
    <TxFlowContext.Provider value={{ ...initialTxFlowContext, txNonce }}>
      <SafeTxContext.Provider value={safeTxContext}>
        <RejectTx onSubmit={jest.fn()} />
      </SafeTxContext.Provider>
    </TxFlowContext.Provider>,
  )

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
    expect(mockCreateRejectTx).toHaveBeenCalledWith(txNonce)
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
})
