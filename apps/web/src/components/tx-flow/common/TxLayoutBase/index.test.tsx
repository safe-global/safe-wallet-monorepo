import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import TxLayoutBase from '.'

// The Safe Shield widget and the status rail pull in network/analytics-heavy hooks; stub them so
// this test focuses on the shared layout logic (what renders, when) rather than their internals.
jest.mock('@/features/safe-shield', () => ({
  __esModule: true,
  default: () => <div data-testid="safe-shield-widget">SafeShield</div>,
}))

jest.mock('@/components/tx-flow/common/TxStatusWidget', () => ({
  __esModule: true,
  default: () => <div data-testid="tx-status-widget">StatusRail</div>,
}))

const Step = () => <div data-testid="step-content">Step content</div>

describe('TxLayoutBase', () => {
  it('renders the title and the current step content', () => {
    render(
      <TxLayoutBase title="Review details" step={0} stepCount={1} progress={100}>
        <Step />
      </TxLayoutBase>,
    )

    expect(screen.getByTestId('modal-title')).toHaveTextContent('Review details')
    expect(screen.getByTestId('step-content')).toBeInTheDocument()
  })

  it('shows the Safe Shield widget and status rail by default', () => {
    render(
      <TxLayoutBase title="Send tokens" step={0} stepCount={2} progress={50}>
        <Step />
      </TxLayoutBase>,
    )

    expect(screen.getByTestId('safe-shield-widget')).toBeInTheDocument()
    expect(screen.getByTestId('tx-status-widget')).toBeInTheDocument()
  })

  it('hides the Safe Shield widget when hideSafeShield is set', () => {
    render(
      <TxLayoutBase title="Activate account" step={0} stepCount={1} progress={100} hideSafeShield>
        <Step />
      </TxLayoutBase>,
    )

    expect(screen.queryByTestId('safe-shield-widget')).not.toBeInTheDocument()
  })

  it('hides both the status rail and the Safe Shield widget for replacement flows', () => {
    render(
      <TxLayoutBase title="Reject transaction" step={0} stepCount={1} progress={100} isReplacement>
        <Step />
      </TxLayoutBase>,
    )

    expect(screen.queryByTestId('tx-status-widget')).not.toBeInTheDocument()
    expect(screen.queryByTestId('safe-shield-widget')).not.toBeInTheDocument()
  })

  it('renders the sidebar slot content under the widget when provided', () => {
    render(
      <TxLayoutBase
        title="Send tokens"
        step={0}
        stepCount={2}
        progress={50}
        sidebarSlot={<div data-testid="sidebar-slot">Slot</div>}
      >
        <Step />
      </TxLayoutBase>,
    )

    expect(screen.getByTestId('sidebar-slot')).toBeInTheDocument()
  })

  it('does not render a back button on the first step', () => {
    render(
      <TxLayoutBase title="Send tokens" step={0} stepCount={3} progress={33} onBack={jest.fn()}>
        <Step />
      </TxLayoutBase>,
    )

    expect(screen.queryByTestId('modal-back-btn')).not.toBeInTheDocument()
  })

  it('renders a back button past the first step and calls onBack when clicked', async () => {
    const onBack = jest.fn()
    const { user } = renderWithUserEvent(
      <TxLayoutBase title="Confirm transaction" step={1} stepCount={3} progress={66} onBack={onBack}>
        <Step />
      </TxLayoutBase>,
    )

    const backButton = screen.getByTestId('modal-back-btn')
    expect(backButton).toBeInTheDocument()

    await user.click(backButton)
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  describe('header strip', () => {
    it('renders the header strip and squares off the card top when there is a subtitle', () => {
      render(
        <TxLayoutBase title="Activate account" subtitle="Deploy Safe account" step={0} stepCount={1} progress={100}>
          <Step />
        </TxLayoutBase>,
      )

      expect(screen.getByTestId('modal-header')).toBeInTheDocument()
      expect(screen.getByTestId('step-content').parentElement?.className).toContain('stepUnderHeader')
    })

    it('renders the header strip when an icon is the only content', () => {
      render(
        <TxLayoutBase title="Recovery" icon={() => <span />} hideNonce step={0} stepCount={1} progress={100}>
          <Step />
        </TxLayoutBase>,
      )

      expect(screen.getByTestId('modal-header')).toBeInTheDocument()
    })

    it('renders the header strip when the nonce chip may show, even with no subtitle or icon', () => {
      render(
        <TxLayoutBase title="New transaction" step={0} stepCount={2} progress={50}>
          <Step />
        </TxLayoutBase>,
      )

      expect(screen.getByTestId('modal-header')).toBeInTheDocument()
    })

    /**
     * A 6px progress bar cannot render the card's 24px corner, so a header strip with nothing but
     * the bar in it read as a stray green line above a square-topped card. With no header row the
     * strip goes and the card keeps its own radius.
     */
    it('drops the header strip when there is no subtitle, icon or nonce', () => {
      render(
        <TxLayoutBase title="Reject transaction" hideNonce step={0} stepCount={1} progress={100}>
          <Step />
        </TxLayoutBase>,
      )

      expect(screen.queryByTestId('modal-header')).not.toBeInTheDocument()
      expect(screen.getByTestId('step-content').parentElement?.className).not.toContain('stepUnderHeader')
    })

    it('still shows the progress bar with no header strip, so multi-step flows keep it', () => {
      render(
        <TxLayoutBase title="Cancel Account recovery" subtitle="" hideNonce step={0} stepCount={3} progress={33}>
          <Step />
        </TxLayoutBase>,
      )

      expect(screen.queryByTestId('modal-header')).not.toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('shows no progress bar at all when hideProgress is set and there is no header', () => {
      render(
        <TxLayoutBase title="Reject transaction" hideNonce hideProgress step={0} stepCount={1} progress={100}>
          <Step />
        </TxLayoutBase>,
      )

      expect(screen.queryByTestId('modal-header')).not.toBeInTheDocument()
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })
  })

  describe('back button spacing', () => {
    it('reserves room under the submit row only on steps that render a back button', () => {
      const { rerender } = render(
        <TxLayoutBase title="Send tokens" step={0} stepCount={3} progress={33} onBack={jest.fn()}>
          <Step />
        </TxLayoutBase>,
      )

      expect(screen.getByTestId('step-content').parentElement?.className).not.toContain('stepWithBackButton')

      rerender(
        <TxLayoutBase title="Send tokens" step={1} stepCount={3} progress={66} onBack={jest.fn()}>
          <Step />
        </TxLayoutBase>,
      )

      expect(screen.getByTestId('step-content').parentElement?.className).toContain('stepWithBackButton')
    })
  })
})
