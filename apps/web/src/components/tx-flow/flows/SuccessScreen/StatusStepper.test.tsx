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

  it('draws one connector segment between rows, stopping short of the dots like the prod StepConnector', () => {
    const { container } = render(<StatusStepper status={PendingStatus.PROCESSING} />)

    const segments = Array.from(container.querySelectorAll('[data-testid="status-step-connector"]'))
    // One per row except the first — the segment sits in the margin above its row.
    expect(segments).toHaveLength(3)

    // Every segment spans exactly the inter-row margin, so it never reaches a dot.
    const marginSpanning = segments.filter(
      (el) => el.className.includes('bottom-full') && el.className.includes('top-[-36px]'),
    )
    expect(marginSpanning).toHaveLength(3)
  })

  it('renders the tx hash in a monospace font', () => {
    const txHash = '0x56414a98b401d63ca2cc800e96fd3fa9b6e14357db08da8053bfb0407070f5db'
    const { container } = render(<StatusStepper status={PendingStatus.PROCESSING} txHash={txHash} />)

    const monoWrapper = container.querySelector('.font-mono')
    expect(monoWrapper).not.toBeNull()
    expect(monoWrapper?.textContent).toContain(txHash)
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
