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
    expect(connector?.className).toContain('flex-1')
    expect(connector?.className).toContain('min-h-6')
  })

  it('gives each bullet icon an opaque backing so it paints above the connector line, not the other way round', () => {
    const { container } = render(<StatusStepper status={PendingStatus.PROCESSING} />)

    const icon = container.querySelector('[data-testid="status-step-icon"]')
    // getAttribute, not .className — an <svg> className is an SVGAnimatedString, not a string
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

    const topStubs = Array.from(container.querySelectorAll('[data-testid="status-step-connector-top"]'))
    expect(topStubs).toHaveLength(4)
    const [firstStub, ...laterStubs] = topStubs
    expect(firstStub.className).not.toContain('bg-[var(--color-border-light)]')
    laterStubs.forEach((stub) => {
      expect(stub.className).toContain('bg-[var(--color-border-light)]')
    })

    avatars.forEach((avatar) => {
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
