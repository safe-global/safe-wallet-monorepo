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

  it('adds no right padding of its own at desktop widths', () => {
    // The right gutter belongs to TxModalDialog, which reserves the column its sticky close button
    // scrolls in. Any `px-`/`pr-` utility here stacks on that and pushes the widget away from the X.
    const { container } = render(
      <TxLayoutBase title="Send tokens" step={0} stepCount={2} progress={50}>
        <Step />
      </TxLayoutBase>,
    )

    const desktopRightPadding = Array.from(container.querySelectorAll('[class]')).filter((el) =>
      /(^|\s)min-\[\d+px\]:p[rx]-/.test(el.className),
    )

    expect(desktopRightPadding).toEqual([])
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

  it('should, past the first step, render a back button with no icon and no minimum width', () => {
    render(
      <TxLayoutBase title="Confirm transaction" step={1} stepCount={3} progress={66} onBack={jest.fn()}>
        <Step />
      </TxLayoutBase>,
    )

    const backButton = screen.getByTestId('modal-back-btn')
    expect(backButton.querySelector('svg')).toBeNull()
    expect(backButton).not.toHaveClass('min-w-[7rem]')
  })

  it('should, when the viewport matches every media query, render an outlined back button', () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = (query: string) =>
      ({
        matches: true,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList

    try {
      render(
        <TxLayoutBase title="Confirm transaction" step={1} stepCount={3} progress={66} onBack={jest.fn()}>
          <Step />
        </TxLayoutBase>,
      )

      expect(screen.getByTestId('modal-back-btn')).toHaveClass('border-border')
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })

  it('should, when the viewport matches no media query, render an outlined back button', () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList

    try {
      render(
        <TxLayoutBase title="Confirm transaction" step={1} stepCount={3} progress={66} onBack={jest.fn()}>
          <Step />
        </TxLayoutBase>,
      )

      expect(screen.getByTestId('modal-back-btn')).toHaveClass('border-border')
    } finally {
      window.matchMedia = originalMatchMedia
    }
  })
})
