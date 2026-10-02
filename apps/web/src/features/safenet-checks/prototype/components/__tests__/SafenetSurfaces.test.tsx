import { fireEvent, render, screen } from '@/tests/test-utils'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'
import { chainBuilder } from '@/tests/builders/chains'
import { TxFlowContext, initialContext } from '@/components/tx-flow/TxFlowProvider'
import { clearCheckStarts, recordCheckStart } from '../../checkStarts'
import { SAFENET_LEARN_MORE_URL, SAFENET_NAME } from '../../copy'
import { SafenetShieldRow, SafenetShieldRowView } from '../SafenetShieldRow'
import { SafenetCardCaptionView } from '../SafenetCardCaption'
import { SafenetHistoryRowView } from '../SafenetHistoryRow'
import { SafenetQueueChip, SafenetQueueChipView } from '../SafenetQueueChip'
import { SafenetTxStatusView } from '../SafenetTxStatus'

jest.mock('@/hooks/useChains', () => ({
  useHasFeature: jest.fn(),
  useCurrentChain: jest.fn(),
}))
jest.mock('@/features/safe-shield/SafeShieldContext', () => ({ useSafeShield: jest.fn() }))

const mockSetSafenetPhase = jest.fn()
const START = 1_700_000_000_000
const EXPLORER = 'https://explorer.safenet-beta.eth.limo/#/safeTx'

describe('Safenet prototype surfaces', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.localStorage.clear()
    ;(useHasFeature as jest.Mock).mockReturnValue(true)
    ;(useCurrentChain as jest.Mock).mockReturnValue(chainBuilder().with({ chainId: '100' }).build())
    ;(useSafeShield as jest.Mock).mockReturnValue({ setSafenetPhase: mockSetSafenetPhase })
  })

  it('renders nothing in the Shield while the prototype flag is off', () => {
    ;(useHasFeature as jest.Mock).mockReturnValue(false)
    const { container } = render(<SafenetShieldRow />)
    expect(container).toBeEmptyDOMElement()
    expect(mockSetSafenetPhase).not.toHaveBeenCalledWith('risk')
  })

  it('shows the before-signing state in a new transaction flow, with no tooltip', () => {
    render(<SafenetShieldRow />)
    expect(screen.getByTestId('safenet-shield-row')).toHaveAttribute('data-phase', 'before-sign')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows the running check in the Shield of a signed transaction', () => {
    const safeTxHash = `0x${'cd'.repeat(32)}`
    clearCheckStarts()
    recordCheckStart(safeTxHash)
    render(
      <TxFlowContext.Provider
        value={{ ...initialContext, txId: `multisig_0x81e84a1e121Add6514170396E864033e087E6216_${safeTxHash}` }}
      >
        <SafenetShieldRow />
      </TxFlowContext.Provider>,
    )
    expect(screen.getByTestId('safenet-shield-row')).toHaveAttribute('data-phase', 'submitted')
    expect(mockSetSafenetPhase).toHaveBeenCalledWith('submitted')
  })

  it('names Safenet and links out to learn more before signing', () => {
    render(<SafenetShieldRowView state={{ phase: 'before-sign' }} nowMs={START} />)
    expect(screen.getByTestId('safenet-name')).toHaveTextContent(SAFENET_NAME)
    expect(screen.getByRole('link', { name: /Learn more/ })).toHaveAttribute('href', SAFENET_LEARN_MORE_URL)
  })

  it('says a running check takes about a minute, politely', () => {
    render(<SafenetShieldRowView state={{ phase: 'checking', etaMs: START + 60_000 }} nowMs={START} />)
    const status = screen.getByText(/It takes about a minute/)
    expect(status.closest('[aria-live]')).toHaveAttribute('aria-live', 'polite')
  })

  it('offers a one-tap enable when the check is locked', () => {
    const onEnable = jest.fn()
    render(<SafenetShieldRowView state={{ phase: 'locked' }} nowMs={START} onEnable={onEnable} />)
    fireEvent.click(screen.getByRole('button', { name: 'Turn on' }))
    expect(onEnable).toHaveBeenCalled()
  })

  it('links a Shield verdict to the Safenet explorer, but not a running check', () => {
    const { rerender } = render(
      <SafenetShieldRowView state={{ phase: 'checking' }} nowMs={START} explorerHref={EXPLORER} />,
    )
    expect(screen.queryByRole('link', { name: /Safenet explorer/ })).not.toBeInTheDocument()

    rerender(<SafenetShieldRowView state={{ phase: 'no-issues' }} nowMs={START} explorerHref={EXPLORER} />)
    expect(screen.getByRole('link', { name: /Safenet explorer/ })).toHaveAttribute('href', EXPLORER)
  })

  it('shows a risk above the action as an alert', () => {
    render(<SafenetCardCaptionView state={{ phase: 'risk' }} role="executor" nowMs={START} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Review it before you execute.')
  })

  it('keeps the queue status visible with the Safenet name', () => {
    render(<SafenetQueueChipView state={{ phase: 'no-issues' }} />)
    expect(screen.getByTestId('safenet-queue-chip')).toHaveTextContent('Safenet: No issues found')
  })

  it('shows the second signer a finished check in the queue', () => {
    render(<SafenetQueueChip safeTxHash={`0x${'ab'.repeat(32)}`} />)
    expect(screen.getByTestId('safenet-queue-chip')).toHaveAttribute('data-phase', 'no-issues')
  })

  it('shows the result and explorer link in the expanded transaction', () => {
    render(<SafenetTxStatusView state={{ phase: 'risk' }} nowMs={START} explorerHref={EXPLORER} />)
    expect(screen.getByTestId('safenet-tx-status')).toHaveTextContent('Safenet: Risk detected')
    expect(screen.getByRole('link', { name: /Safenet explorer/ })).toHaveAttribute('href', EXPLORER)
  })

  it('links to the Safenet explorer in history only once there is a verdict', () => {
    const { rerender } = render(<SafenetHistoryRowView state={{ phase: 'checking' }} explorerHref={EXPLORER} />)
    expect(screen.queryByRole('link', { name: /View on Safenet explorer/ })).not.toBeInTheDocument()

    rerender(<SafenetHistoryRowView state={{ phase: 'no-issues' }} explorerHref={EXPLORER} />)
    expect(screen.getByRole('link', { name: /View on Safenet explorer/ })).toHaveAttribute('href', EXPLORER)
  })
})
