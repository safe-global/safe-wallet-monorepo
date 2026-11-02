import type { ReactNode } from 'react'
import { Interface, JsonRpcProvider } from 'ethers'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { renderWithUserEvent, waitFor } from '@/tests/test-utils'
import { mockHasFeature } from '@/tests/mocks/hooks'
import { safeTxBuilder } from '@/tests/builders/safeTx'
import { safeTxContextBuilder } from '@/tests/builders/safeTxContext'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import { RecoveryFeature, type RecoveryQueueItem } from '@/features/recovery'
import { seedRecoveryScenario } from '@/features/recovery/test-helpers'
import { createTx } from '@/services/tx/tx-sender'
import { trackEvent } from '@/services/analytics'
import { RECOVERY_EVENTS } from '@/services/analytics/events/recovery'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { CancelRecoveryFlowReview } from './CancelRecoveryFlowReview'

jest.mock('@/hooks/useChains')
jest.mock('@/hooks/wallets/web3ReadOnly', () => ({
  ...jest.requireActual('@/hooks/wallets/web3ReadOnly'),
  useWeb3ReadOnly: jest.fn(),
}))
jest.mock('@/services/tx/tx-sender', () => ({ createTx: jest.fn() }))
jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))
jest.mock('@/components/tx/ReviewTransactionV2', () => ({
  __esModule: true,
  default: ({ children, onSubmit }: { children: ReactNode; onSubmit: () => void }) => (
    <>
      {children}
      <button onClick={onSubmit}>Continue</button>
    </>
  ),
}))

const mockCreateTx = jest.mocked(createTx)
const builtTx = safeTxBuilder().build()
const delayInterface = new Interface(['function setTxNonce(uint256 _nonce)'])

const renderReview = (recovery: RecoveryQueueItem) => {
  const context = safeTxContextBuilder().build()
  const onSubmit = jest.fn()

  const result = renderWithUserEvent(
    <SafeTxContext.Provider value={context}>
      <CancelRecoveryFlowReview recovery={recovery} onSubmit={onSubmit} />
    </SafeTxContext.Provider>,
  )

  return { ...result, context, onSubmit }
}

describe('CancelRecoveryFlowReview', () => {
  beforeAll(async () => {
    await RecoveryFeature.load()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockHasFeature({ [FEATURES.RECOVERY]: true })
    jest.mocked(useWeb3ReadOnly).mockReturnValue(new JsonRpcProvider(undefined, 1, { staticNetwork: true }))
    mockCreateTx.mockResolvedValue(builtTx)
  })

  it('explains that the signers stay and that the recovery proposal is cancelled', async () => {
    const { findByText, getByText } = renderReview(seedRecoveryScenario('waiting'))

    expect(
      await findByText(
        'All actions initiated by the Recoverer will be cancelled. The current signers will remain the signers of the Safe account.',
      ),
    ).toBeInTheDocument()
    expect(getByText(/initiate the cancellation of the recovery proposal/)).toBeInTheDocument()
  })

  it('names a malicious proposal as a malicious transaction', async () => {
    const recovery = { ...seedRecoveryScenario('waiting'), isMalicious: true }

    const { findByText, queryByText } = renderReview(recovery)

    expect(await findByText(/initiate the cancellation of the malicious transaction/)).toBeInTheDocument()
    expect(queryByText(/cancellation of the recovery proposal/)).not.toBeInTheDocument()
  })

  it('skips the proposal by moving the Delay modifier nonce past it', async () => {
    const recovery = seedRecoveryScenario('waiting')

    const { context } = renderReview(recovery)

    await waitFor(() => expect(context.setSafeTx).toHaveBeenCalledWith(builtTx))
    const [call] = mockCreateTx.mock.calls[0]
    expect(call.to).toBe(recovery.address)
    expect(call.value).toBe('0')
    const [newTxNonce] = delayInterface.decodeFunctionData('setTxNonce', call.data)
    expect(newTxNonce).toBe(recovery.args.queueNonce + 1n)
  })

  it('reports an error when the cancellation cannot be built', async () => {
    const error = new Error('Cannot build transaction')
    mockCreateTx.mockRejectedValue(error)

    const { context } = renderReview(seedRecoveryScenario('waiting'))

    await waitFor(() => expect(context.setSafeTxError).toHaveBeenCalledWith(error))
    expect(context.setSafeTx).not.toHaveBeenCalled()
  })

  it('builds no transaction while there is no RPC provider', async () => {
    jest.mocked(useWeb3ReadOnly).mockReturnValue(undefined)

    const { findByText } = renderReview(seedRecoveryScenario('waiting'))

    await findByText(/initiate the cancellation/)
    expect(mockCreateTx).not.toHaveBeenCalled()
  })

  it('tracks the cancellation and submits', async () => {
    const { findByRole, onSubmit, user } = renderReview(seedRecoveryScenario('waiting'))

    await user.click(await findByRole('button', { name: 'Continue' }))

    expect(trackEvent).toHaveBeenCalledWith(RECOVERY_EVENTS.SUBMIT_RECOVERY_CANCEL)
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
