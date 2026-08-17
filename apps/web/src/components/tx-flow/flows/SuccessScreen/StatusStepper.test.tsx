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

  it('offsets the bullet down within its rail so its center lines up with the avatar center, on every row (regression for dots floating above the avatars)', () => {
    const { container } = render(<StatusStepper status={PendingStatus.PROCESSING} />)

    const icons = container.querySelectorAll('[data-testid="status-step-icon"]')
    const avatars = container.querySelectorAll('[data-testid="status-step-avatar"]')

    expect(icons).toHaveLength(4)
    expect(avatars).toHaveLength(4)

    // Every rail carries a 12px top stub that centers the dot against the avatar; it is
    // painted as connector line on all rows except the first, so the previous row's
    // segment visually touches this row's dot.
    const topStubs = Array.from(container.querySelectorAll('[data-testid="status-step-connector-top"]'))
    expect(topStubs).toHaveLength(4)
    const [firstStub, ...laterStubs] = topStubs
    expect(firstStub.className).not.toContain('bg-[var(--color-border-light)]')
    laterStubs.forEach((stub) => {
      expect(stub.className).toContain('bg-[var(--color-border-light)]')
    })

    avatars.forEach((avatar) => {
      // The avatar must stay pinned to the row's top edge regardless of how tall the
      // sibling text block grows (e.g. a wrapped tx hash on the first step) — otherwise
      // its center would drift and no single rail offset could track it.
      expect(avatar.className).toContain('self-start')
    })
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
