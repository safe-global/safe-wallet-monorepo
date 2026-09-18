import { render, screen, waitFor } from '@/tests/test-utils'
import { ExecuteTxStep } from '.'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { initialContext, TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { createExistingTx } from '@/services/tx/tx-sender'
import { createMockSafeTransaction } from '@/tests/transactions'
import { faker } from '@faker-js/faker'

jest.mock('@/services/tx/tx-sender', () => ({ createExistingTx: jest.fn() }))
jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: jest.fn(() => '1') }))
jest.mock('@/components/tx/confirmation-views/useTxPreview', () => ({
  __esModule: true,
  default: jest.fn(() => [undefined, undefined, false]),
}))
jest.mock('@/components/tx/ConfirmTxDetails/Receipt', () => ({
  Receipt: () => <div data-testid="receipt" />,
}))
jest.mock('@/components/tx-flow/actions/Execute', () => ({
  __esModule: true,
  default: () => null,
  Execute: () => <div data-testid="execute-action" />,
}))

const mockCreateExistingTx = createExistingTx as jest.MockedFunction<typeof createExistingTx>

describe('ExecuteTxStep', () => {
  const txId = `multisig_${faker.finance.ethereumAddress()}_${faker.string.hexadecimal({ length: 64 })}`
  const unsignedTx = createMockSafeTransaction({ to: faker.finance.ethereumAddress(), data: '0x' })
  const reloadedTx = createMockSafeTransaction({ to: unsignedTx.data.to, data: '0x' })

  const renderStep = () => {
    const setSafeTx = jest.fn()
    const safeTxContext = { safeTx: unsignedTx, setSafeTx, setSafeTxError: jest.fn() } as unknown as SafeTxContextParams

    render(
      <SafeTxContext.Provider value={safeTxContext}>
        <TxFlowContext.Provider value={{ ...initialContext, txId }}>
          <ExecuteTxStep />
        </TxFlowContext.Provider>
      </SafeTxContext.Provider>,
    )

    return { setSafeTx }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('reloads the signed transaction from the gateway and then offers Execute', async () => {
    mockCreateExistingTx.mockResolvedValue(reloadedTx)

    const { setSafeTx } = renderStep()

    expect(screen.queryByTestId('execute-action')).not.toBeInTheDocument()

    await waitFor(() => {
      expect(setSafeTx).toHaveBeenCalledWith(reloadedTx)
      expect(screen.getByTestId('execute-action')).toBeInTheDocument()
    })
    expect(mockCreateExistingTx).toHaveBeenCalledWith('1', txId, undefined, undefined)
    expect(screen.getByTestId('receipt')).toBeInTheDocument()
  })

  it('keeps the loading state when the reload fails', async () => {
    mockCreateExistingTx.mockRejectedValue(new Error('offline'))

    renderStep()

    await waitFor(() => {
      expect(mockCreateExistingTx).toHaveBeenCalled()
    })
    expect(screen.queryByTestId('execute-action')).not.toBeInTheDocument()
  })
})
