import { faker } from '@faker-js/faker'
import { fireEvent, waitFor } from '@testing-library/react'
import { OperationType } from '@safe-global/types-kit'
import { Multi_send__factory } from '@safe-global/utils/types/contracts/factories/@safe-global/safe-deployments/dist/assets/v1.3.0'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { render as renderTestUtils, screen } from '@/tests/test-utils'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { createMockSafeTransaction } from '@/tests/transactions'
import { mockHasFeature, mockIsSafeOwner } from '@/tests/mocks/hooks'
import { getStoreInstance } from '@/store'
import useSafeInfo from '@/hooks/useSafeInfo'
import BatchingSlot, { Batching } from '..'
import { initialContext, TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import { SlotName, SlotProvider, useSlotIds } from '@/components/tx-flow/slots'
import { TxModalContext } from '@/components/tx-flow'
import { txDataBuilder, txInfoBuilder } from '@/tests/builders/safeTx'
import { BATCH_EVENTS, trackEvent } from '@/services/analytics'
import type { TransactionPreview } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useIsSafeOwner')
jest.mock('@/hooks/useChains')
jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const mockUseChains = jest.requireMock('@/hooks/useChains').default as jest.Mock
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
  feePaymentMode: 'safe',
  setFeePaymentMode: jest.fn(),
  setFeeGasToken: jest.fn(),
}

const render = (
  safeTx: SafeTxContextParams['safeTx'],
  txFlowContext: Partial<TxFlowContextType> = {},
  txPreview?: TransactionPreview,
) =>
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
            txPreview={txPreview}
          />
        </SafeTxContext.Provider>
      </TxFlowContext.Provider>
    </TxModalContext.Provider>,
  )

const ComboSubmitSlotIds = () => (
  <span data-testid="combo-submit-slot-ids">{useSlotIds(SlotName.ComboSubmit).join(' ')}</span>
)

const renderSlot = (txFlowContext: Partial<TxFlowContextType> = {}) => {
  const safeTx = createMockSafeTransaction({ to: faker.finance.ethereumAddress(), data: '0x' })

  return renderTestUtils(
    <SlotProvider>
      <TxFlowContext.Provider value={{ ...initialContext, isCreation: true, ...txFlowContext }}>
        <SafeTxContext.Provider value={{ ...safeTxContext, safeTx }}>
          <BatchingSlot />
          <ComboSubmitSlotIds />
        </SafeTxContext.Provider>
      </TxFlowContext.Provider>
    </SlotProvider>,
  )
}

const selectAllBatchItems = () =>
  Object.values(getStoreInstance().getState().batch).flatMap((bySafe) => Object.values(bySafe).flat())

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  mockUseChains.mockReturnValue({ configs: [] })
  mockUseSafeInfo.mockReturnValue({
    safe: safeInfo,
    safeAddress: safeInfo.address.value,
    safeLoading: false,
    safeLoaded: true,
    safeError: undefined,
  })
})

describe('Batching slot', () => {
  beforeEach(() => {
    mockIsSafeOwner(true)
    mockHasFeature({ [FEATURES.BATCHING]: true })
  })

  it('offers Add to batch for a new transaction of an owner', () => {
    renderSlot()

    expect(screen.getByTestId('combo-submit-slot-ids')).toHaveTextContent('batching')
  })

  it('does not offer Add to batch for an on-chain rejection', () => {
    renderSlot({ isBatchable: false })

    expect(screen.getByTestId('combo-submit-slot-ids')).not.toHaveTextContent('batching')
  })
})

describe('Batching action', () => {
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

  it('labels the batch tracking event with the previewed transaction type', async () => {
    const txPreview: TransactionPreview = { txInfo: txInfoBuilder().build(), txData: txDataBuilder().build() }
    const safeTx = createMockSafeTransaction({ to: faker.finance.ethereumAddress(), data: '0x' })

    const { getByTestId } = render(safeTx, {}, txPreview)
    fireEvent.click(getByTestId('combo-submit-batching'))

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith({ ...BATCH_EVENTS.BATCH_TX_APPENDED, label: txPreview.txInfo.type })
    })
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
