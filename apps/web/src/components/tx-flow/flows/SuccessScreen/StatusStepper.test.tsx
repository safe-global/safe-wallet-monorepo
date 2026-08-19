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

  it('draws connector segments that touch the dots: none above the first or below the last', () => {
    const { container } = render(<StatusStepper status={PendingStatus.PROCESSING} />)

    const segments = Array.from(container.querySelectorAll('[data-testid="status-step-connector"]'))
    // 1 below the first row, 2 on each middle row, 1 above the last row.
    expect(segments).toHaveLength(6)

    // Every segment is anchored to the dot's edge (50% of the row ± the dot radius).
    const anchored = segments.filter((el) => el.className.includes('calc(50%+7px)'))
    expect(anchored).toHaveLength(6)
  })

  it('spaces the rows apart while the segments span the gap', () => {
    const { container } = render(<StatusStepper status={PendingStatus.PROCESSING} />)

    const icons = container.querySelectorAll('[data-testid="status-step-icon"]')
    icons.forEach((icon) => {
      const row = icon.parentElement as HTMLElement
      expect(row.className).toContain('[&:not(:first-child)]:mt-9')
      // Rows center the dot and content vertically, like the pre-migration StepLabel.
      expect(row.className).toContain('items-center')
      // The SuccessScreen card sets text-center; rows must opt out or wide content
      // (e.g. a full tx hash) centers the label above it.
      expect(row.className).toContain('text-left')
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
