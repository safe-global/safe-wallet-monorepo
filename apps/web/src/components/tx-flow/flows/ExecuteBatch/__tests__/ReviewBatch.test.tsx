import type { ModuleTransaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { QuotaExceededError } from '@safe-global/utils/services/quotaErrors'
import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import * as useChains from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import { ReviewBatch } from '../ReviewBatch'

const SAFE_ADDRESS = '0x0000000000000000000000000000000000000001'
const SPACE_ID = '11111111-1111-1111-1111-111111111111'

const mockUseSafeSponsoredTxs = jest.fn()
const mockUseRelaysBySafe = jest.fn()
const mockDispatchBatchExecutionRelay = jest.fn()

// The feature barrel cannot be mocked partially (circular import at init), so the source hook module is.
jest.mock('@/features/spaces/hooks/useSafeSponsoredTxs', () => ({
  useSafeSponsoredTxs: () => mockUseSafeSponsoredTxs(),
}))
jest.mock('@/hooks/useRemainingRelays', () => ({ useRelaysBySafe: () => mockUseRelaysBySafe() }))
jest.mock('@/services/tx/tx-sender', () => ({
  createMultiSendCallOnlyTx: jest.fn().mockResolvedValue(undefined),
  dispatchBatchExecution: jest.fn(),
  dispatchBatchExecutionRelay: (...args: unknown[]) => mockDispatchBatchExecutionRelay(...args),
}))
jest.mock('@/components/tx/ExecutionMethodSelector', () => ({
  ...jest.requireActual('@/components/tx/ExecutionMethodSelector'),
  ExecutionMethodSelector: ({ executionMethod }: { executionMethod: string }) => (
    <div data-testid="execution-method-selector" data-method={executionMethod} />
  ),
}))
jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({
    safe: { chainId: '1', address: { value: SAFE_ADDRESS }, version: '1.3.0', nonce: 0, threshold: 1 },
  }),
}))
// Stable references: fresh ones on every render would restart the multiSend encoding.
const mockTxDetails = { data: [{ txId: 'multisig_0x01' }], error: undefined, isLoading: false }
const mockMultiSend = { multiSendContract: {}, multiSendContractAddress: undefined }
jest.mock('@safe-global/store/gateway/transactions', () => ({
  useTransactionsGetMultipleTransactionDetailsQuery: () => mockTxDetails,
}))
jest.mock('../useMultiSendContract', () => ({ useMultiSendContract: () => mockMultiSend }))
jest.mock('@/utils/transactions', () => ({ getMultiSendTxs: async () => [] }))
jest.mock('@safe-global/protocol-kit', () => ({ encodeMultiSendData: () => '0xdead' }))
jest.mock('@/features/safe-shield/SafeShieldContext', () => ({
  useSafeShield: () => ({ needsRiskConfirmation: false, isRiskConfirmed: false }),
  useSafeShieldForTxData: jest.fn(),
}))
jest.mock('@/hooks/useGasPrice', () => ({
  __esModule: true,
  default: () => [{ maxFeePerGas: BigInt(1), maxPriorityFeePerGas: BigInt(1) }],
}))
jest.mock('@/components/tx/AdvancedParams/useUserNonce', () => ({ __esModule: true, default: () => 1 }))
jest.mock('@/hooks/wallets/useOnboard', () => ({ __esModule: true, default: () => ({}) }))
jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (ok: boolean) => React.ReactElement }) => children(true),
}))
jest.mock('@/components/tx-flow/flows/ExecuteBatch/DecodedTxs', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/new-safe/create/NetworkWarning', () => ({ __esModule: true, default: () => null }))

const pro = (left: number) => ({
  isEnabled: true,
  isPro: true,
  meter: { used: 50 - left, quota: 50, resetsAt: '2026-11-01T00:00:00.000Z' },
  left,
  spaceId: SPACE_ID,
  canSponsor: left > 0,
  isLoading: false,
})

const renderReviewBatch = () =>
  render(<ReviewBatch params={{ txs: [{ transaction: { id: 'multisig_0x01' } } as ModuleTransaction] }} />)

// Submitting is a no-op until the encoded multiSend data has resolved.
const submit = async () => {
  await screen.findByText('0xdead')
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
}

describe('ReviewBatch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .spyOn(useChains, 'useCurrentChain')
      .mockReturnValue(chainBuilder().with({ chainId: '1', features: [] }).build())
    mockUseRelaysBySafe.mockReturnValue([{ remaining: 0, limit: 5 }])
  })

  it("relays the batch against the Workspace's allowance on a Safe Pro Safe", async () => {
    mockUseSafeSponsoredTxs.mockReturnValue(pro(30))
    renderReviewBatch()

    await submit()

    await waitFor(() => expect(mockDispatchBatchExecutionRelay).toHaveBeenCalled())
    expect(mockDispatchBatchExecutionRelay.mock.lastCall?.at(-1)).toBe(SPACE_ID)
  })

  it('explains a spent allowance and falls back to the wallet when the relay hits the quota', async () => {
    mockUseSafeSponsoredTxs.mockReturnValue(pro(30))
    mockDispatchBatchExecutionRelay.mockRejectedValue(
      new QuotaExceededError('sponsored_transactions', 50, 50, '2026-11-01T00:00:00.000Z', 'Quota exceeded'),
    )
    renderReviewBatch()

    await submit()

    expect(await screen.findByText(/used all 50 sponsored transactions of this cycle/)).toBeInTheDocument()
    expect(screen.getByTestId('execution-method-selector')).toHaveAttribute('data-method', 'WALLET')
  })

  it('keeps the gas-fee selector on screen once the allowance is spent', () => {
    mockUseSafeSponsoredTxs.mockReturnValue(pro(0))
    renderReviewBatch()

    expect(screen.getByTestId('execution-method-selector')).toBeInTheDocument()
  })

  it('hides the selector for a Safe with neither a plan nor chain relays left', () => {
    mockUseSafeSponsoredTxs.mockReturnValue({ ...pro(0), isEnabled: false, isPro: false, spaceId: null })
    renderReviewBatch()

    expect(screen.queryByTestId('execution-method-selector')).not.toBeInTheDocument()
  })
})
