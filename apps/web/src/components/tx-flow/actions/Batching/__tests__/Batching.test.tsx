import { faker } from '@faker-js/faker'
import { fireEvent, waitFor } from '@testing-library/react'
import { OperationType } from '@safe-global/types-kit'
import { Multi_send__factory } from '@safe-global/utils/types/contracts/factories/@safe-global/safe-deployments/dist/assets/v1.3.0'
import { render as renderTestUtils } from '@/tests/test-utils'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { createMockSafeTransaction } from '@/tests/transactions'
import { getStoreInstance } from '@/store'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Batching } from '..'
import { initialContext, TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { TxModalContext } from '@/components/tx-flow'

jest.mock('@/hooks/useSafeInfo')

const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const safeInfo = extendedSafeInfoBuilder().build()

const setTxFlow = jest.fn()
const setSubmitError = jest.fn()
const setIsSubmitLoading = jest.fn()
const onSubmitSuccess = jest.fn()

const safeTxContext: Omit<SafeTxContextParams, 'safeTx'> = {
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
}

const render = (safeTx: SafeTxContextParams['safeTx'], txFlowContext: Partial<TxFlowContextType> = {}) =>
  renderTestUtils(
    <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
      <TxFlowContext.Provider value={{ ...initialContext, setSubmitError, setIsSubmitLoading, ...txFlowContext }}>
        <SafeTxContext.Provider value={{ ...safeTxContext, safeTx }}>
          <Batching
            onSubmit={jest.fn()}
            onSubmitSuccess={onSubmitSuccess}
            onChange={jest.fn()}
            options={[{ id: 'batching', label: 'Add to batch' }]}
            slotId="batching"
          />
        </SafeTxContext.Provider>
      </TxFlowContext.Provider>
    </TxModalContext.Provider>,
  )

const selectAllBatchItems = () =>
  Object.values(getStoreInstance().getState().batch).flatMap((bySafe) => Object.values(bySafe).flat())

describe('Batching action', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockUseSafeInfo.mockReturnValue({
      safe: safeInfo,
      safeAddress: safeInfo.address.value,
      safeLoading: false,
      safeLoaded: true,
      safeError: undefined,
    })
  })

  it('stores the transaction in the batch and closes the flow without contacting the gateway', async () => {
    const to = faker.finance.ethereumAddress()
    const safeTx = createMockSafeTransaction({ to, data: '0x', value: '7' })

    const { getByTestId } = render(safeTx)
    fireEvent.click(getByTestId('combo-submit-batching'))

    await waitFor(() => {
      expect(setTxFlow).toHaveBeenCalledWith(undefined)
    })
    expect(selectAllBatchItems()).toEqual([
      expect.objectContaining({ txData: { to, value: '7', data: '0x', operation: OperationType.Call } }),
    ])
    expect(onSubmitSuccess).toHaveBeenCalledWith({ isExecuted: false })
    expect(setSubmitError).not.toHaveBeenCalledWith(expect.any(Error))
  })

  it('shows a submit error when the transaction cannot be decoded', async () => {
    const malformedMultiSend = `${Multi_send__factory.createInterface().getFunction('multiSend').selector}00`
    const safeTx = createMockSafeTransaction({ to: faker.finance.ethereumAddress(), data: malformedMultiSend })

    const { getByTestId } = render(safeTx)
    fireEvent.click(getByTestId('combo-submit-batching'))

    await waitFor(() => {
      expect(setSubmitError).toHaveBeenCalledWith(expect.any(Error))
    })
    expect(setIsSubmitLoading).toHaveBeenLastCalledWith(false)
    expect(setTxFlow).not.toHaveBeenCalled()
    expect(selectAllBatchItems()).toEqual([])
  })
})
