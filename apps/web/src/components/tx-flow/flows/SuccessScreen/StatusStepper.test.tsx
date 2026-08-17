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

  it('gives every step room to breathe so the connector reaches the next step (regression for cramped bullet icons)', () => {
    const { container } = render(<StatusStepper status={PendingStatus.PROCESSING} />)

    const stepper = container.querySelector('[data-testid="status-stepper"]')
    const stepperClasses = stepper?.className ?? ''

    // Non-last rows must get bottom padding (the vertical gap between steps) and the
    // connector line must span into that padding, not stop flush at the row's own edge.
    expect(stepperClasses).toContain('[&>*:not(:last-child)]:pb-6')
    expect(stepperClasses).toContain('[&>*:not(:last-child)]:after:bottom-0')
    // The old implementation clipped the connector to the row's own box (`h-full`), which
    // left zero visual gap between steps once no external margin/gap was present.
    expect(stepperClasses).not.toContain('after:h-full')
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
