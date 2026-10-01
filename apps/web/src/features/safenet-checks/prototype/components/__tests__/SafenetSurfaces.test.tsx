import { fireEvent, render, screen } from '@/tests/test-utils'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'
import { chainBuilder } from '@/tests/builders/chains'
import { SafenetShieldRow, SafenetShieldRowView } from '../SafenetShieldRow'
import { SafenetShieldFootView } from '../SafenetShieldFoot'
import { SafenetCardCaptionView } from '../SafenetCardCaption'
import { SafenetTxRailView } from '../SafenetTxRail'
import { SafenetHistoryRowView } from '../SafenetHistoryRow'

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

  it('announces Shield row status changes politely', () => {
    render(<SafenetShieldRowView state={{ phase: 'submitted', startedAtMs: START }} />)
    expect(screen.getByText('Sent to Safenet for an independent check.').closest('[aria-live]')).toHaveAttribute(
      'aria-live',
      'polite',
    )
  })

  it('offers a one-tap enable when the check is locked', () => {
    const onEnable = jest.fn()
    render(<SafenetShieldRowView state={{ phase: 'locked' }} onEnable={onEnable} />)
    fireEvent.click(screen.getByRole('button', { name: 'Turn on' }))
    expect(onEnable).toHaveBeenCalled()
  })

  it('links a Shield verdict to the Safenet explorer, but not a running check', () => {
    const { rerender } = render(<SafenetShieldRowView state={{ phase: 'checking' }} explorerHref={EXPLORER} />)
    expect(screen.queryByRole('link', { name: /Safenet explorer/ })).not.toBeInTheDocument()

    rerender(<SafenetShieldRowView state={{ phase: 'no-issues' }} explorerHref={EXPLORER} />)
    expect(screen.getByRole('link', { name: /Safenet explorer/ })).toHaveAttribute('href', EXPLORER)
  })

  it('shows progress and the ETA at the foot of the Shield while checking', () => {
    render(
      <SafenetShieldFootView
        state={{ phase: 'checking', startedAtMs: START, etaMs: START + 60_000 }}
        nowMs={START + 17_000}
      />,
    )
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '28')
    expect(screen.getByText('Ready in ~43 seconds')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Why does this take longer/ })).toBeInTheDocument()
  })

  it('offers to wait for a running check at the execute step without forcing it', () => {
    const onWait = jest.fn()
    render(<SafenetCardCaptionView state={{ phase: 'checking', startedAtMs: START }} step="execute" onWait={onWait} />)
    expect(
      screen.getByText('Safenet has not reported yet. You can execute now or wait for the result.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Wait for result' }))
    expect(onWait).toHaveBeenCalled()
  })

  it('moves focus to the caption once a waited-for check lands', () => {
    const { rerender } = render(
      <SafenetCardCaptionView state={{ phase: 'checking', startedAtMs: START }} step="sign" isWaiting />,
    )
    rerender(<SafenetCardCaptionView state={{ phase: 'no-issues', startedAtMs: START }} step="sign" isWaiting />)
    expect(screen.getByTestId('safenet-card-caption')).toHaveFocus()
  })

  it('marks the current rail step and shows Safenet under Sign', () => {
    render(
      <SafenetTxRailView
        current="confirm"
        safenet={{ state: { phase: 'before-sign' }, nowMs: START }}
        signatures={{ submitted: 1, required: 2 }}
      />,
    )
    expect(screen.getByText('Confirm').closest('li')).toHaveAttribute('aria-current', 'step')
    expect(screen.getByText('Offchain · free · 1 of 2 signed')).toBeInTheDocument()
    expect(screen.getByTestId('safenet-rail-note')).toHaveTextContent('Safenet starts here')
  })

  it('links to the Safenet explorer in history only once there is a verdict', () => {
    const { rerender } = render(<SafenetHistoryRowView state={{ phase: 'checking' }} explorerHref={EXPLORER} />)
    expect(screen.queryByRole('link', { name: /View on Safenet explorer/ })).not.toBeInTheDocument()

    rerender(<SafenetHistoryRowView state={{ phase: 'no-issues' }} explorerHref={EXPLORER} />)
    expect(screen.getByRole('link', { name: /View on Safenet explorer/ })).toHaveAttribute('href', EXPLORER)
  })
})
