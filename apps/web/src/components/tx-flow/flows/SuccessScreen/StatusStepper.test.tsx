import { render } from '@/tests/test-utils'
import { mockSafeInfo } from '@/tests/mocks/hooks'
import { PendingStatus } from '@/store/pendingTxsSlice'
import StatusStepper from './StatusStepper'

jest.mock('@/hooks/useSafeInfo')

describe('StatusStepper', () => {
  beforeEach(() => {
    mockSafeInfo()
  })

  it('renders one row per execution step', () => {
    const { container } = render(<StatusStepper status={PendingStatus.PROCESSING} />)

    const stepper = container.querySelector('[data-testid="status-stepper"]')
    expect(stepper?.children).toHaveLength(4)
  })

  it('renders a bullet icon for every step', () => {
    const { container } = render(<StatusStepper status={PendingStatus.PROCESSING} />)

    expect(container.querySelectorAll('[data-testid="status-step-icon"]')).toHaveLength(4)
  })

  it('renders a connector line between every step but not after the last one (regression for cramped/discontinuous bullets)', () => {
    const { container } = render(<StatusStepper status={PendingStatus.PROCESSING} />)

    const icons = container.querySelectorAll('[data-testid="status-step-icon"]')
    const connectors = container.querySelectorAll('[data-testid="status-step-connector"]')

    // One connector per gap between steps, never one trailing the last step.
    expect(connectors).toHaveLength(icons.length - 1)
  })

  it('gives the connector line a guaranteed minimum length so steps never look cramped, even with short content', () => {
    const { container } = render(<StatusStepper status={PendingStatus.PROCESSING} />)

    const connector = container.querySelector('[data-testid="status-step-connector"]')
    // flex-1 + min-h-6: the line always spans at least 24px and stretches with row content,
    // rather than being clipped to whatever height the row's own box happens to have.
    expect(connector?.className).toContain('flex-1')
    expect(connector?.className).toContain('min-h-6')
  })

  it('gives each bullet icon an opaque backing so it paints above the connector line, not the other way round', () => {
    const { container } = render(<StatusStepper status={PendingStatus.PROCESSING} />)

    const icon = container.querySelector('[data-testid="status-step-icon"]')
    // Icon and connector are siblings within the same flex column, in this DOM order — the icon
    // is laid out before the line, and an opaque, rounded backing keeps the line from ever
    // reading as if it were drawn in front of (or through) the bullet.
    // (Read via getAttribute, not .className — for an <svg> element className is an
    // SVGAnimatedString, not a plain string.)
    const iconClasses = icon?.getAttribute('class') ?? ''
    expect(iconClasses).toContain('bg-[var(--color-background-paper)]')
    expect(iconClasses).toContain('rounded-full')
  })

  it.each([
    [PendingStatus.PROCESSING, 'Processing'],
    [PendingStatus.INDEXING, 'Indexing'],
    [undefined, 'Indexed'],
  ])('shows the expected status label for %s', (status, expectedText) => {
    const { getByText } = render(<StatusStepper status={status} />)

    expect(getByText(expectedText)).toBeInTheDocument()
  })
})
