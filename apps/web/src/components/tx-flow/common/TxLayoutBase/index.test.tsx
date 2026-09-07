import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import TxLayoutBase, { BACK_BUTTON_ROW_QUERY } from '.'

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

  // Mirrors the layout switch in styles.module.css: at Tailwind `lg` the actions become a
  // right-aligned row and the back button joins it as an outlined button on the left; below that
  // the actions are stacked and the back button is a centered ghost link underneath (WA-3479).
  describe('back button variant', () => {
    const originalMatchMedia = window.matchMedia

    const stubMatchMedia = (matchingQuery: string) => {
      window.matchMedia = (query: string) =>
        ({
          matches: query === matchingQuery,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }) as MediaQueryList
    }

    afterEach(() => {
      window.matchMedia = originalMatchMedia
    })

    it('is outlined from 1024px up, where it shares a row with the primary action', () => {
      stubMatchMedia(BACK_BUTTON_ROW_QUERY)

      render(
        <TxLayoutBase title="Confirm transaction" step={1} stepCount={3} progress={66} onBack={jest.fn()}>
          <Step />
        </TxLayoutBase>,
      )

      expect(screen.getByTestId('modal-back-btn')).toHaveClass('border-border')
    })

    it('is a ghost button below 1024px, where it is centered under the stacked actions', () => {
      stubMatchMedia('(min-width:1200px)')

      render(
        <TxLayoutBase title="Confirm transaction" step={1} stepCount={3} progress={66} onBack={jest.fn()}>
          <Step />
        </TxLayoutBase>,
      )

      expect(screen.getByTestId('modal-back-btn')).not.toHaveClass('border-border')
    })
  })
})
