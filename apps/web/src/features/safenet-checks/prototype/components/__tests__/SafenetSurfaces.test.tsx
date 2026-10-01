import { fireEvent, render, screen } from '@/tests/test-utils'
import { useCurrentChain, useHasFeature } from '@/hooks/useChains'
import { useSafeShield } from '@/features/safe-shield/SafeShieldContext'
import { chainBuilder } from '@/tests/builders/chains'
import { SafenetShieldRow, SafenetShieldRowView } from '../SafenetShieldRow'
import { SafenetExecuteStatusView } from '../SafenetExecuteStatus'
import { SafenetHistoryRowView } from '../SafenetHistoryRow'

jest.mock('@/hooks/useChains', () => ({
  useHasFeature: jest.fn(),
  useCurrentChain: jest.fn(),
}))
jest.mock('@/features/safe-shield/SafeShieldContext', () => ({ useSafeShield: jest.fn() }))

const mockSetHasSafenetRisk = jest.fn()
const START = 1_700_000_000_000

describe('Safenet prototype surfaces', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.localStorage.clear()
    ;(useHasFeature as jest.Mock).mockReturnValue(true)
    ;(useCurrentChain as jest.Mock).mockReturnValue(chainBuilder().with({ chainId: '100' }).build())
    ;(useSafeShield as jest.Mock).mockReturnValue({ setHasSafenetRisk: mockSetHasSafenetRisk })
  })

  it('renders nothing in the Shield while the prototype flag is off', () => {
    ;(useHasFeature as jest.Mock).mockReturnValue(false)
    const { container } = render(<SafenetShieldRow />)
    expect(container).toBeEmptyDOMElement()
    expect(mockSetHasSafenetRisk).not.toHaveBeenCalledWith(true)
  })

  it('announces status changes politely', () => {
    render(<SafenetShieldRowView state={{ phase: 'submitted', startedAtMs: START }} nowMs={START} />)
    expect(screen.getByText('Sent to Safenet for an independent check.').closest('[aria-live]')).toHaveAttribute(
      'aria-live',
      'polite',
    )
  })

  it('offers a one-tap enable when the check is locked', () => {
    const onEnable = jest.fn()
    render(<SafenetShieldRowView state={{ phase: 'locked' }} nowMs={START} onEnable={onEnable} />)
    fireEvent.click(screen.getByRole('button', { name: 'Turn on' }))
    expect(onEnable).toHaveBeenCalled()
  })

  it('offers to wait for a running check without forcing it', () => {
    const onWait = jest.fn()
    render(
      <SafenetExecuteStatusView
        state={{ phase: 'checking', startedAtMs: START, etaMs: START + 60_000 }}
        nowMs={START + 12_000}
        onWait={onWait}
      />,
    )
    expect(screen.getByText(/about 1 min/)).toBeInTheDocument()
    expect(screen.getByText('Running for 0:12')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Wait for result' }))
    expect(onWait).toHaveBeenCalled()
  })

  it('moves focus to the verdict once a waited-for check lands', () => {
    const { rerender } = render(
      <SafenetExecuteStatusView state={{ phase: 'checking', startedAtMs: START }} nowMs={START} isWaiting />,
    )
    rerender(<SafenetExecuteStatusView state={{ phase: 'no-issues', startedAtMs: START }} nowMs={START} isWaiting />)
    expect(screen.getByText('Safenet found no issues.').closest('[aria-live]')).toHaveFocus()
  })

  it('links to the Safenet explorer only once there is a verdict', () => {
    const href = 'https://explorer.safenet-beta.eth.limo/#/safeTx'
    const { rerender } = render(<SafenetHistoryRowView state={{ phase: 'checking' }} explorerHref={href} />)
    expect(screen.queryByRole('link', { name: /View on Safenet explorer/ })).not.toBeInTheDocument()

    rerender(<SafenetHistoryRowView state={{ phase: 'no-issues' }} explorerHref={href} />)
    expect(screen.getByRole('link', { name: /View on Safenet explorer/ })).toHaveAttribute('href', href)
  })
})
