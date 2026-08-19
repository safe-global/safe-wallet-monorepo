import { render } from '@/tests/test-utils'
import { mockSafeInfo } from '@/tests/mocks/hooks'
import { PendingStatus } from '@/store/pendingTxsSlice'
import StatusStepper from './StatusStepper'

jest.mock('@/hooks/useSafeInfo')

describe('StatusStepper', () => {
  beforeEach(() => {
    mockSafeInfo()
  })

  it('renders a bullet icon for every step', () => {
    const { container } = render(<StatusStepper status={PendingStatus.PROCESSING} />)

    expect(container.querySelectorAll('[data-testid="status-step-icon"]')).toHaveLength(4)
  })

  it('renders a standalone connector between every step but not before the first or after the last', () => {
    const { container } = render(<StatusStepper status={PendingStatus.PROCESSING} />)

    const stepper = container.querySelector('[data-testid="status-stepper"]') as HTMLElement
    const children = Array.from(stepper.children)
    const icons = container.querySelectorAll('[data-testid="status-step-icon"]')

    // One connector per gap between steps, like MUI's StepConnector.
    expect(container.querySelectorAll('[data-testid="status-step-connector"]')).toHaveLength(icons.length - 1)
    expect(children[0].getAttribute('data-testid')).not.toBe('status-step-connector')
    expect(children[children.length - 1].getAttribute('data-testid')).not.toBe('status-step-connector')
  })

  it('gives the connector a guaranteed minimum length so steps never look cramped', () => {
    const { container } = render(<StatusStepper status={PendingStatus.PROCESSING} />)

    const connector = container.querySelector('[data-testid="status-step-connector"]')
    expect(connector?.className).toContain('min-h-9')
    // ml-[6.5px] lines the segment up under the dot's horizontal center.
    expect(connector?.className).toContain('ml-[6.5px]')
  })

  it('centers the dot and content within each row, like the pre-migration StepLabel', () => {
    const { container } = render(<StatusStepper status={PendingStatus.PROCESSING} />)

    const icons = container.querySelectorAll('[data-testid="status-step-icon"]')
    expect(icons).toHaveLength(4)

    icons.forEach((icon) => {
      expect(icon.parentElement?.className).toContain('items-center')
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
