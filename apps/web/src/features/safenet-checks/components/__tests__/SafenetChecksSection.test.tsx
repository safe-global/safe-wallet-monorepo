import { render, screen } from '@/tests/test-utils'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { DetailedExecutionInfoType } from '@safe-global/store/gateway/types'
import { CheckStatus, type PublicCheckStatus } from '@safe-global/utils/features/safenet-checks'
import { useSafenetCheck } from '@safe-global/utils/features/safenet-checks/hooks'
import { buildCheckView, buildSnapshot } from '@safe-global/utils/features/safenet-checks/builders'
import { SafenetChecksSection } from '../SafenetChecksSection'

jest.mock('@safe-global/utils/features/safenet-checks/hooks', () => ({
  ...jest.requireActual('@safe-global/utils/features/safenet-checks/hooks'),
  useSafenetCheck: jest.fn(),
}))

const mockUseSafenetCheck = useSafenetCheck as jest.MockedFunction<typeof useSafenetCheck>

const HASH = `0x${'cd'.repeat(32)}`
const SAFE = '0x0000000000000000000000000000000000000123'
const TX_ID = `multisig_${SAFE}_${HASH}`
const SUBMITTED_AT = 1_700_000_000_000

const txDetails = {
  detailedExecutionInfo: {
    type: DetailedExecutionInfoType.MULTISIG,
    submittedAt: SUBMITTED_AT,
  },
} as unknown as TransactionDetails

const renderInFlow = (flow: Partial<TxFlowContextType>) =>
  render(
    <TxFlowContext.Provider value={flow as TxFlowContextType}>
      <SafenetChecksSection />
    </TxFlowContext.Provider>,
  )

describe('SafenetChecksSection', () => {
  beforeEach(() => jest.clearAllMocks())

  it('subscribes with the hash from the flow txId and the submission time', () => {
    mockUseSafenetCheck.mockReturnValue(buildCheckView())

    renderInFlow({ txId: TX_ID, txDetails })

    expect(mockUseSafenetCheck).toHaveBeenCalledWith(
      HASH,
      SUBMITTED_AT,
      expect.objectContaining({ chainId: expect.any(String) }),
    )
  })

  it('renders nothing for a creation flow (no txId, no canonical hash)', () => {
    mockUseSafenetCheck.mockReturnValue(buildCheckView())

    const { container } = renderInFlow({})

    expect(mockUseSafenetCheck).toHaveBeenCalledWith(
      undefined,
      undefined,
      expect.objectContaining({ chainId: expect.any(String) }),
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('never subscribes before the submission time is known (shared cache aims by the last args)', () => {
    mockUseSafenetCheck.mockReturnValue(buildCheckView())

    const { container } = renderInFlow({ txId: TX_ID })

    expect(mockUseSafenetCheck).toHaveBeenCalledWith(
      undefined,
      undefined,
      expect.objectContaining({ chainId: expect.any(String) }),
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing while the first read is still in flight', () => {
    mockUseSafenetCheck.mockReturnValue(buildCheckView({ isLoading: true, isFetching: true }))

    const { container } = renderInFlow({ txId: TX_ID, txDetails })

    expect(container).toBeEmptyDOMElement()
  })

  it('renders the no-check copy when no check was requested', () => {
    const snapshot = buildSnapshot({ safeTxHash: HASH as `0x${string}`, status: CheckStatus.UNAVAILABLE })
    mockUseSafenetCheck.mockReturnValue(
      buildCheckView({
        snapshot,
        status: CheckStatus.UNAVAILABLE,
        publicStatus: CheckStatus.UNAVAILABLE,
        unavailableReason: 'NO_CHECK',
      }),
    )

    renderInFlow({ txId: TX_ID, txDetails })

    const section = screen.getByTestId('safenet-checks-section')
    expect(section).toHaveAttribute('data-reason', 'NO_CHECK')
    expect(section).toHaveTextContent('Not checked')
    expect(section).toHaveTextContent('No Safenet check was requested for this transaction.')
  })

  it('renders the read-failed copy when the status could not be read', () => {
    mockUseSafenetCheck.mockReturnValue(
      buildCheckView({
        status: CheckStatus.UNAVAILABLE,
        publicStatus: CheckStatus.UNAVAILABLE,
        unavailableReason: 'READ_FAILED',
      }),
    )

    renderInFlow({ txId: TX_ID, txDetails })

    const section = screen.getByTestId('safenet-checks-section')
    expect(section).toHaveAttribute('data-reason', 'READ_FAILED')
    expect(section).toHaveTextContent('Status unavailable')
    expect(section).toHaveTextContent('The Safenet check status could not be read. Retry later.')
  })

  it.each<[Exclude<PublicCheckStatus, CheckStatus.UNAVAILABLE>, string]>([
    [CheckStatus.SUBMITTED, 'Check submitted to Safenet.'],
    [CheckStatus.IN_PROGRESS, 'Safenet is simulating this transaction.'],
    [CheckStatus.BENIGN, 'Safenet found no issues'],
    [CheckStatus.MALICIOUS, 'Safenet flagged this address/transaction as malicious'],
    [CheckStatus.TIMED_OUT, 'Safenet check is unavailable. You can still continue.'],
  ])('renders %s copy', (status, copy) => {
    const snapshot = buildSnapshot({ safeTxHash: HASH as `0x${string}`, status })
    mockUseSafenetCheck.mockReturnValue(buildCheckView({ snapshot, status, publicStatus: status }))

    renderInFlow({ txId: TX_ID, txDetails })

    const section = screen.getByTestId('safenet-checks-section')
    expect(section).toHaveAttribute('data-status', status)
    expect(section).toHaveTextContent('Safenet check')
    expect(section).toHaveTextContent(copy)
  })
})
