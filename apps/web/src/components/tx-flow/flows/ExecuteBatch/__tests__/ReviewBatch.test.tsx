import type { ReactElement } from 'react'
import { faker } from '@faker-js/faker'
import { render, screen, waitFor, fireEvent } from '@/tests/test-utils'
import { mockCurrentChain, mockSafeInfo, mockWallet } from '@/tests/mocks/hooks'
import { getMockTx } from '@/tests/mocks/transactions'
import { transactionDetailsBuilder } from '@/tests/builders/transactionDetails'
import { QuotaExceededError } from '@safe-global/utils/services/quotaErrors'
import { GasPaymentOptionUnavailableError, RelayerUnavailableError } from '@safe-global/utils/services/gasPaymentErrors'
import { dispatchBatchExecution, dispatchBatchExecutionRelay } from '@/services/tx/tx-sender'
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

jest.mock('../useMultiSendContract', () => ({
  useMultiSendContract: () => ({
    multiSendContract: {},
    multiSendContractAddress: '0x0000000000000000000000000000000000000003',
  }),
}))

jest.mock('../DecodedTxs', () => ({ __esModule: true, default: () => null }))

jest.mock('@/hooks/useGasPrice', () => ({
  __esModule: true,
  default: () => [{ maxFeePerGas: BigInt(1), maxPriorityFeePerGas: BigInt(1) }, undefined, false],
}))

jest.mock('@/components/tx/AdvancedParams/useUserNonce', () => ({ __esModule: true, default: () => 1 }))

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/wallets/useOnboard', () => ({ __esModule: true, default: () => ({}) }))
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useChains')

jest.mock('@/features/safe-shield/SafeShieldContext', () => ({
  useSafeShield: () => ({ needsRiskConfirmation: false, isRiskConfirmed: false }),
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

const UNAVAILABLE_MESSAGE =
  "This gas payment option isn't available for this Safe account right now. Choose another gas payment method and execute again."

const dailyOffer: SponsoredOffer = {
  option: 'FREE_DAILY_LIMIT',
  disabledReason: null,
  relays: { remaining: 3, limit: 5 },
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
    isLoading: false,
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

  it('executes through the connected wallet without an offer', async () => {
    mockGasPaymentOptions({ offer: null })
    renderReviewBatch()

    expect(screen.queryByTestId('execution-method-selector')).not.toBeInTheDocument()

    await submit()

    await waitFor(() => expect(mockDispatchBatchExecution).toHaveBeenCalledTimes(1))
    expect(mockDispatchBatchExecutionRelay).not.toHaveBeenCalled()
  })

  it('hides the selector and disables submit while the gas payment options load', () => {
    mockGasPaymentOptions({ isLoading: true })
    renderReviewBatch()

    expect(screen.queryByTestId('execution-method-selector')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled()
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

  it('excludes every sponsored option when the relay refuses a pay-from-Safe transaction', async () => {
    mockDispatchBatchExecutionRelay.mockRejectedValue(
      new GasPaymentOptionUnavailableError('PAY_FROM_SAFE', 'NOT_LISTED', [], 'Unavailable'),
    )
    renderReviewBatch()

    await submit()

    expect(await screen.findByText(UNAVAILABLE_MESSAGE)).toBeInTheDocument()
    expect(mockExclude).toHaveBeenCalledWith(['NO_FEE_CAMPAIGN', 'FREE_DAILY_LIMIT', 'SUBSCRIPTION'])
  })

  it('excludes the offered option when the chain has no relayer', async () => {
    mockDispatchBatchExecutionRelay.mockRejectedValue(new RelayerUnavailableError('No relayer defined'))
    renderReviewBatch()

    await submit()

    expect(await screen.findByText(UNAVAILABLE_MESSAGE)).toBeInTheDocument()
    expect(mockExclude).toHaveBeenCalledWith(['FREE_DAILY_LIMIT'])
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
