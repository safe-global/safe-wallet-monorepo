import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import type { ReactNode } from 'react'
import { ExecuteTxStep } from '.'
import { TxModalContext } from '@/components/tx-flow'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { initialContext, TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { createExistingTx } from '@/services/tx/tx-sender'
import { createMockSafeTransaction } from '@/tests/transactions'
import { faker } from '@faker-js/faker'
import { AppRoutes } from '@/config/routes'

jest.mock('@/services/tx/tx-sender', () => ({ createExistingTx: jest.fn() }))
jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: jest.fn(() => '1') }))
jest.mock('@/components/tx/confirmation-views/useTxPreview', () => ({
  __esModule: true,
  default: jest.fn(() => [undefined, undefined, false]),
}))
jest.mock('@/components/tx/ConfirmTxDetails/Receipt', () => ({
  Receipt: ({ tabsOutside }: { tabsOutside?: boolean }) => (
    <div data-testid="receipt" data-tabs-outside={String(!!tabsOutside)} />
  ),
}))
jest.mock('@/components/tx-flow/actions/Execute', () => ({
  __esModule: true,
  default: () => null,
  Execute: ({ secondaryAction }: { secondaryAction?: ReactNode }) => (
    <div data-testid="execute-action">{secondaryAction}</div>
  ),
}))

const mockCreateExistingTx = createExistingTx as jest.MockedFunction<typeof createExistingTx>

describe('ExecuteTxStep', () => {
  const txId = `multisig_${faker.finance.ethereumAddress()}_${faker.string.hexadecimal({ length: 64 })}`
  const unsignedTx = createMockSafeTransaction({ to: faker.finance.ethereumAddress(), data: '0x' })
  const reloadedTx = createMockSafeTransaction({ to: unsignedTx.data.to, data: '0x' })

  const renderStep = ({ afterSigning }: { afterSigning?: boolean } = {}) => {
    const setSafeTx = jest.fn()
    const setTxFlow = jest.fn()
    const onPrev = jest.fn()
    const push = jest.fn()
    const updateTxLayoutProps = jest.fn()
    const safeQuery = `eth:${faker.finance.ethereumAddress()}`
    const safeTxContext = { safeTx: unsignedTx, setSafeTx, setSafeTxError: jest.fn() } as unknown as SafeTxContextParams

    render(
      <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
        <SafeTxContext.Provider value={safeTxContext}>
          <TxFlowContext.Provider value={{ ...initialContext, txId, onPrev, updateTxLayoutProps }}>
            <ExecuteTxStep afterSigning={afterSigning} />
          </TxFlowContext.Provider>
        </SafeTxContext.Provider>
      </TxModalContext.Provider>,
      { routerProps: { push, query: { safe: safeQuery } } },
    )

    return { setSafeTx, setTxFlow, onPrev, push, safeQuery, updateTxLayoutProps }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('reloads the signed transaction from the gateway and then offers Execute', async () => {
    mockCreateExistingTx.mockResolvedValue(reloadedTx)

    const { setSafeTx } = renderStep()

    expect(screen.queryByTestId('execute-action')).not.toBeInTheDocument()
    expect(screen.queryByRole('note')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(setSafeTx).toHaveBeenCalledWith(reloadedTx)
      expect(screen.getByTestId('execute-action')).toBeInTheDocument()
    })
    expect(mockCreateExistingTx).toHaveBeenCalledWith('1', txId, undefined, undefined)
    expect(screen.getByTestId('receipt')).toBeInTheDocument()
  })

  it('explains the signed-but-not-submitted state above the receipt and the cost of executing below the button', async () => {
    mockCreateExistingTx.mockResolvedValue(reloadedTx)

    renderStep()

    const signedNotice = await screen.findByTestId('signed-notice')
    const executeNotice = screen.getByTestId('execute-notice')

    expect(signedNotice).toHaveTextContent(
      'This transaction is fully signed. Nothing has been sent to the network yet.',
    )
    expect(executeNotice).toHaveTextContent(
      "Executing submits this transaction on-chain and costs gas. Anyone can execute it — it doesn't have to be you.",
    )
    expect(screen.getAllByRole('note')).toEqual([signedNotice, executeNotice])
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    const receipt = screen.getByTestId('receipt')
    const execute = screen.getByTestId('execute-action')
    expect(signedNotice.compareDocumentPosition(receipt) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(execute.compareDocumentPosition(executeNotice) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows the receipt tabs outside the panel', async () => {
    mockCreateExistingTx.mockResolvedValue(reloadedTx)

    renderStep()

    expect(await screen.findByTestId('receipt')).toHaveAttribute('data-tabs-outside', 'true')
  })

  it('offers Back in the button row instead of the layout back button when opened from the queue', async () => {
    mockCreateExistingTx.mockResolvedValue(reloadedTx)

    const { onPrev, updateTxLayoutProps } = renderStep()

    const back = await screen.findByTestId('modal-back-btn')
    expect(screen.getByTestId('execute-action')).toContainElement(back)
    expect(screen.queryByTestId('execute-later-btn')).not.toBeInTheDocument()
    expect(updateTxLayoutProps).toHaveBeenCalledWith(expect.objectContaining({ hideBack: true }))

    fireEvent.click(back)

    expect(onPrev).toHaveBeenCalled()
  })

  it('offers to execute later by closing the flow and opening the queue when reached after signing', async () => {
    mockCreateExistingTx.mockResolvedValue(reloadedTx)

    const { setTxFlow, push, safeQuery } = renderStep({ afterSigning: true })

    const executeLater = await screen.findByTestId('execute-later-btn')
    expect(screen.getByTestId('execute-action')).toContainElement(executeLater)
    expect(screen.queryByTestId('modal-back-btn')).not.toBeInTheDocument()

    fireEvent.click(executeLater)

    expect(setTxFlow).toHaveBeenCalledWith(undefined)
    expect(push).toHaveBeenCalledWith({ pathname: AppRoutes.transactions.queue, query: { safe: safeQuery } })
  })

  it('keeps the loading state when the reload fails', async () => {
    mockCreateExistingTx.mockRejectedValue(new Error('offline'))

    renderStep()

    await waitFor(() => {
      expect(mockCreateExistingTx).toHaveBeenCalled()
    })
    expect(screen.queryByTestId('execute-action')).not.toBeInTheDocument()
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })
})
