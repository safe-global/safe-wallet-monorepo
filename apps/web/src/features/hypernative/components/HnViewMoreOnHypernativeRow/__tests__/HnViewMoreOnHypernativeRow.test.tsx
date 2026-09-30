import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HnViewMoreOnHypernativeRow } from '..'
import { HYPERNATIVE_EVENTS } from '@/services/analytics/events/hypernative'

const trackEventMock = jest.fn()
jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: (...args: unknown[]) => trackEventMock(...args),
}))

describe('HnViewMoreOnHypernativeRow', () => {
  beforeEach(() => {
    trackEventMock.mockClear()
  })

  it('renders the overflow count and CTA text', () => {
    render(<HnViewMoreOnHypernativeRow overflowCount={2} assessmentUrl="https://hn.example/report" />)
    expect(screen.getByText('+2')).toBeInTheDocument()
    expect(screen.getByText('More issues found')).toBeInTheDocument()
    expect(screen.getByText('View full report on Hypernative')).toBeInTheDocument()
  })

  it('links to the assessment URL with target=_blank and noopener', () => {
    render(<HnViewMoreOnHypernativeRow overflowCount={2} assessmentUrl="https://hn.example/report" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://hn.example/report')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('tracks analytics on click', async () => {
    const user = userEvent.setup()
    render(<HnViewMoreOnHypernativeRow overflowCount={2} assessmentUrl="https://hn.example/report" />)
    await user.click(screen.getByRole('link'))
    expect(trackEventMock).toHaveBeenCalledWith(HYPERNATIVE_EVENTS.HYPERNATIVE_FULL_REPORT_CLICKED)
  })

  it('returns null when assessmentUrl is null', () => {
    const { container } = render(<HnViewMoreOnHypernativeRow overflowCount={2} assessmentUrl={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('returns null when overflowCount is 0', () => {
    const { container } = render(
      <HnViewMoreOnHypernativeRow overflowCount={0} assessmentUrl="https://hn.example/report" />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
