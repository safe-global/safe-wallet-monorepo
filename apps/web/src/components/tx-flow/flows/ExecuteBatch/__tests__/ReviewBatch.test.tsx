import type { ReactElement } from 'react'
import { faker } from '@faker-js/faker'
import { render, screen, waitFor, fireEvent } from '@/tests/test-utils'
import { mockCurrentChain, mockSafeInfo, mockWallet } from '@/tests/mocks/hooks'
import { getMockTx } from '@/tests/mocks/transactions'
import { transactionDetailsBuilder } from '@/tests/builders/transactionDetails'
import { QuotaExceededError } from '@safe-global/utils/services/quotaErrors'
import { createMultiSendCallOnlyTx, dispatchBatchExecution, dispatchBatchExecutionRelay } from '@/services/tx/tx-sender'
import { createMockSafeTransaction } from '@/tests/transactions'
import { trackEvent, MixpanelEventParams } from '@/services/analytics'
import { logError } from '@/services/exceptions'
import type { GasPaymentOptions } from '@/hooks/useGasPaymentOptions'
import type { SponsoredOffer } from '@/utils/gasPayment'
import * as transactionUtils from '@/utils/transactions'
import { ReviewBatch } from '../ReviewBatch'

const mockUseGasPaymentOptions = jest.fn<GasPaymentOptions, []>()
jest.mock('@/hooks/useGasPaymentOptions', () => ({
  useGasPaymentOptions: () => mockUseGasPaymentOptions(),
}))

jest.mock('@/components/tx/ExecutionMethodSelector', () => ({
  ExecutionMethod: { RELAY: 'RELAY', WALLET: 'WALLET' },
  ExecutionMethodSelector: ({ offer }: { offer: SponsoredOffer | null }) => (
    <div data-testid="execution-method-selector" data-offer={JSON.stringify(offer)} />
  ),
}))

jest.mock('@/services/tx/tx-sender', () => ({
  dispatchBatchExecution: jest.fn(),
  dispatchBatchExecutionRelay: jest.fn(),
  createMultiSendCallOnlyTx: jest.fn(),
}))

const mockTxDetails = [transactionDetailsBuilder().build(), transactionDetailsBuilder().build()]
jest.mock('@safe-global/store/gateway/transactions', () => ({
  useTransactionsGetMultipleTransactionDetailsQuery: () => ({
    data: mockTxDetails,
    error: undefined,
    isLoading: false,
  }),
}))

const MULTI_SEND = { multiSendContract: {}, multiSendContractAddress: '0x0000000000000000000000000000000000000003' }
const mockUseMultiSendContract = jest.fn<{ multiSendContract?: object; multiSendContractAddress: string }, []>(
  () => MULTI_SEND,
)
jest.mock('../useMultiSendContract', () => ({ useMultiSendContract: () => mockUseMultiSendContract() }))

const mockUseSafeSDK = jest.fn<object | undefined, []>(() => ({}))
jest.mock('@/hooks/coreSDK/safeCoreSDK', () => ({ getSafeSDK: jest.fn(), useSafeSDK: () => mockUseSafeSDK() }))

jest.mock('../DecodedTxs', () => ({ __esModule: true, default: () => null }))

jest.mock('@/hooks/useGasPrice', () => ({
  __esModule: true,
  default: () => [{ maxFeePerGas: BigInt(1), maxPriorityFeePerGas: BigInt(1) }, undefined, false],
}))

const mockUseUserNonce = jest.fn<number | undefined, []>(() => 1)
jest.mock('@/components/tx/AdvancedParams/useUserNonce', () => ({
  __esModule: true,
  default: () => mockUseUserNonce(),
}))

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/wallets/useOnboard', () => ({ __esModule: true, default: () => ({}) }))
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useChains')

type RiskState = { needsRiskConfirmation: boolean; isRiskConfirmed: boolean; setIsRiskConfirmed: jest.Mock }
const NO_RISK: RiskState = { needsRiskConfirmation: false, isRiskConfirmed: false, setIsRiskConfirmed: jest.fn() }
const mockUseSafeShield = jest.fn<RiskState, []>(() => NO_RISK)
jest.mock('@/features/safe-shield/SafeShieldContext', () => ({
  useSafeShield: () => mockUseSafeShield(),
  useSafeShieldForTxData: () => undefined,
}))

jest.mock('@/services/tx/tx-sender/recommendedNonce', () => ({
  fetchRecommendedParams: jest.fn(() => Promise.resolve({ safeTxGas: '0' })),
}))

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default({ children }: { children: (ok: boolean) => ReactElement }) {
    return children(true)
  },
}))

const mockDispatchBatchExecution = dispatchBatchExecution as jest.MockedFunction<typeof dispatchBatchExecution>
const mockDispatchBatchExecutionRelay = dispatchBatchExecutionRelay as jest.MockedFunction<
  typeof dispatchBatchExecutionRelay
>

const dailyOffer: SponsoredOffer = {
  option: 'FREE_DAILY_LIMIT',
  disabledReason: null,
  relays: { remaining: 3, limit: 5 },
  isPro: false,
}

const subscriptionOffer: SponsoredOffer = {
  option: 'SUBSCRIPTION',
  disabledReason: null,
  spaceId: faker.string.numeric(3),
  left: 10,
  meter: null,
}

const mockExclude = jest.fn()

const mockGasPaymentOptions = (overrides: Partial<GasPaymentOptions> = {}) => {
  mockUseGasPaymentOptions.mockReturnValue({
    offer: dailyOffer,
    showsProUpsell: false,
    exclude: mockExclude,
    ...overrides,
  })
}

const renderReviewBatch = () =>
  render(<ReviewBatch params={{ txs: [getMockTx({ nonce: 1 }), getMockTx({ nonce: 2 })] }} />)

const submit = async () => {
  await screen.findByText('Data')
  const button = screen.getByRole('button', { name: 'Submit' })
  await waitFor(() => expect(button).toBeEnabled())
  fireEvent.click(button)
}

describe('ReviewBatch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseUserNonce.mockReturnValue(1)
    mockUseSafeSDK.mockReturnValue({})
    mockUseMultiSendContract.mockReturnValue(MULTI_SEND)
    mockUseSafeShield.mockReturnValue(NO_RISK)
    mockSafeInfo({ version: '1.4.1' })
    const chain = mockCurrentChain()
    ;(jest.requireMock('@/hooks/useChains').default as jest.Mock).mockReturnValue({ configs: [chain] })
    mockWallet()
    mockGasPaymentOptions()
    jest.spyOn(transactionUtils, 'getMultiSendTxs').mockResolvedValue([
      { to: faker.finance.ethereumAddress(), value: '0', data: '0x', operation: 0 },
      { to: faker.finance.ethereumAddress(), value: '0', data: '0x', operation: 0 },
    ])
    mockDispatchBatchExecution.mockResolvedValue(faker.string.hexadecimal({ length: 64 }))
    mockDispatchBatchExecutionRelay.mockResolvedValue(undefined)
  })

  describe('when Safe Shield needs a risk confirmation', () => {
    const mockCreateMultiSendCallOnlyTx = createMultiSendCallOnlyTx as jest.MockedFunction<
      typeof createMultiSendCallOnlyTx
    >

    beforeEach(() => {
      mockCreateMultiSendCallOnlyTx.mockResolvedValue(
        createMockSafeTransaction({ to: faker.finance.ethereumAddress(), data: '0x' }),
      )
    })

    const mockRiskState = (isRiskConfirmed: boolean) => {
      const setIsRiskConfirmed = jest.fn()
      mockUseSafeShield.mockReturnValue({ needsRiskConfirmation: true, isRiskConfirmed, setIsRiskConfirmed })
      return setIsRiskConfirmed
    }

    it('shows the risk checkbox and keeps Submit disabled until the risk is confirmed', async () => {
      const setIsRiskConfirmed = mockRiskState(false)
      renderReviewBatch()

      expect(
        await screen.findByText('I understand the risks and would like to proceed with this transaction.'),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()

      fireEvent.click(screen.getByRole('checkbox'))

      expect(setIsRiskConfirmed).toHaveBeenCalledTimes(1)
    })

    it('shows no risk checkbox and keeps Submit disabled until the MultiSend transaction is built', async () => {
      mockRiskState(false)
      mockCreateMultiSendCallOnlyTx.mockReturnValue(new Promise(() => {}))
      renderReviewBatch()

      await screen.findByText('Data')
      expect(screen.queryByTestId('risk-confirmation-checkbox')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
    })

    it('builds the MultiSend transaction once the Safe SDK is ready', async () => {
      mockRiskState(false)
      mockUseSafeSDK.mockReturnValue(undefined)
      const review = <ReviewBatch params={{ txs: [getMockTx({ nonce: 1 }), getMockTx({ nonce: 2 })] }} />
      const { rerender } = render(review)

      await screen.findByText('Data')
      expect(mockCreateMultiSendCallOnlyTx).not.toHaveBeenCalled()
      expect(screen.queryByTestId('risk-confirmation-checkbox')).not.toBeInTheDocument()

      mockUseSafeSDK.mockReturnValue({})
      rerender(review)

      expect(
        await screen.findByText('I understand the risks and would like to proceed with this transaction.'),
      ).toBeInTheDocument()
      expect(mockCreateMultiSendCallOnlyTx).toHaveBeenCalledTimes(1)
    })

    it('shows the risk checkbox when the MultiSend transaction cannot be built', async () => {
      mockRiskState(false)
      mockCreateMultiSendCallOnlyTx.mockRejectedValue(new Error('The Safe SDK is not initialized'))
      renderReviewBatch()

      expect(
        await screen.findByText('I understand the risks and would like to proceed with this transaction.'),
      ).toBeInTheDocument()
    })

    it('executes the batch once the risk is confirmed', async () => {
      mockRiskState(true)
      renderReviewBatch()

      await submit()

      await waitFor(() => expect(mockDispatchBatchExecutionRelay).toHaveBeenCalledTimes(1))
    })
  })

  it('shows no risk checkbox when Safe Shield needs no confirmation', async () => {
    renderReviewBatch()

    await screen.findByText('Data')
    expect(screen.queryByTestId('risk-confirmation-checkbox')).not.toBeInTheDocument()
  })

  it('relays a daily offer through the chain route', async () => {
    renderReviewBatch()

    expect(screen.getByTestId('execution-method-selector')).toHaveAttribute('data-offer', JSON.stringify(dailyOffer))

    await submit()

    await waitFor(() => expect(mockDispatchBatchExecutionRelay).toHaveBeenCalledTimes(1))
    expect(mockDispatchBatchExecutionRelay.mock.calls[0][6]).toBeNull()
    expect(mockDispatchBatchExecution).not.toHaveBeenCalled()
  })

  it('relays a subscription offer through the space route', async () => {
    mockGasPaymentOptions({ offer: subscriptionOffer })
    renderReviewBatch()

    await submit()

    await waitFor(() => expect(mockDispatchBatchExecutionRelay).toHaveBeenCalledTimes(1))
    expect(mockDispatchBatchExecutionRelay.mock.calls[0][6]).toBe(subscriptionOffer.spaceId)
  })

  it('hides the selector and executes through the connected wallet while no offer is on offer yet', async () => {
    mockGasPaymentOptions({ offer: null, showsProUpsell: false })
    renderReviewBatch()

    expect(screen.queryByTestId('execution-method-selector')).not.toBeInTheDocument()

    await submit()

    await waitFor(() => expect(mockDispatchBatchExecution).toHaveBeenCalledTimes(1))
    expect(mockDispatchBatchExecutionRelay).not.toHaveBeenCalled()
  })

  it('executes through a connected wallet that has sent no transaction yet', async () => {
    mockGasPaymentOptions({ offer: null, showsProUpsell: false })
    mockUseUserNonce.mockReturnValue(0)
    renderReviewBatch()

    await submit()

    await waitFor(() => expect(mockDispatchBatchExecution).toHaveBeenCalledTimes(1))
    expect(mockDispatchBatchExecution.mock.calls[0][7]).toEqual(expect.objectContaining({ nonce: 0 }))
  })

  it('keeps Submit disabled and sends nothing while the connected wallet has no nonce', async () => {
    mockGasPaymentOptions({ offer: null, showsProUpsell: false })
    mockUseUserNonce.mockReturnValue(undefined)
    renderReviewBatch()

    await screen.findByText('Data')
    const button = screen.getByRole('button', { name: 'Submit' })
    expect(button).toBeDisabled()

    fireEvent.click(button)
    expect(mockDispatchBatchExecution).not.toHaveBeenCalled()
  })

  it('keeps Submit disabled and relays nothing while the MultiSend contract is missing', async () => {
    mockUseMultiSendContract.mockReturnValue({ ...MULTI_SEND, multiSendContract: undefined })
    renderReviewBatch()

    await screen.findByText('Data')
    const button = screen.getByRole('button', { name: 'Submit' })
    expect(button).toBeDisabled()

    fireEvent.click(button)
    expect(mockDispatchBatchExecutionRelay).not.toHaveBeenCalled()
  })

  it('excludes the subscription and shows the quota message on a quota refusal', async () => {
    mockGasPaymentOptions({ offer: subscriptionOffer })
    mockDispatchBatchExecutionRelay.mockRejectedValue(
      new QuotaExceededError('sponsored_transactions', 10, 10, null, 'Quota exceeded'),
    )
    renderReviewBatch()

    await submit()

    expect(
      await screen.findByText(
        'Your Workspace has used all 10 sponsored transactions of this cycle. Pay the gas with your connected wallet instead.',
      ),
    ).toBeInTheDocument()
    expect(mockExclude).toHaveBeenCalledWith(['SUBSCRIPTION'])
    expect(mockDispatchBatchExecutionRelay).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled()
  })

  it('shows the generic submit error for any other failure', async () => {
    mockDispatchBatchExecutionRelay.mockRejectedValue(new Error('Boom'))
    renderReviewBatch()

    await submit()

    expect(await screen.findByText(/Could not submit the transaction/)).toBeInTheDocument()
    expect(logError).toHaveBeenCalled()
    expect(mockExclude).not.toHaveBeenCalled()
  })

  it('tracks the gas payment option on success', async () => {
    renderReviewBatch()

    await submit()

    await waitFor(() => expect(trackEvent).toHaveBeenCalled())
    expect(mockDispatchBatchExecutionRelay).toHaveBeenCalledTimes(1)
    expect(trackEvent).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ [MixpanelEventParams.GAS_PAYMENT_OPTION]: 'FREE_DAILY_LIMIT' }),
    )
  })
})
