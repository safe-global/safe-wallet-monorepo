import { fireEvent, render, screen } from '@/tests/test-utils'
import { trackEvent } from '@/services/analytics'
import { SAFE_PRO_EVENTS } from '@/services/analytics/events/safe-pro'
import CompareFeaturesCard from '../CompareFeaturesCard'

jest.mock('@/services/analytics', () => ({ ...jest.requireActual('@/services/analytics'), trackEvent: jest.fn() }))
jest.mock('@/features/hypernative', () => ({
  HnSignupFlow: ({ open }: { open: boolean }) => (open ? <div data-testid="hn-signup-flow" /> : null),
}))

const renderCard = (isExpanded: boolean) => {
  const onExpandedChange = jest.fn()
  render(<CompareFeaturesCard currentPlanName="Business" isExpanded={isExpanded} onExpandedChange={onExpandedChange} />)
  return onExpandedChange
}

describe('CompareFeaturesCard', () => {
  it('shows the coming-soon rows and hides the rest until expanded', () => {
    const onExpandedChange = renderCard(false)

    expect(screen.getByRole('button', { name: 'Compare all features' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('Safenet checks').closest('tbody')).not.toHaveAttribute('inert')
    expect(screen.getByText('Security Hub').closest('tbody')).toHaveAttribute('inert')

    fireEvent.click(screen.getByRole('button', { name: 'Expand table' }))
    expect(onExpandedChange).toHaveBeenCalledWith(true)
  })

  it('opens every section and closes again from the header', () => {
    const onExpandedChange = renderCard(true)

    expect(screen.getByText('Security Hub').closest('tbody')).not.toHaveAttribute('inert')
    fireEvent.click(screen.getByRole('button', { name: 'Compare all features' }))
    expect(onExpandedChange).toHaveBeenCalledWith(false)
  })

  it('marks the current plan column once', () => {
    renderCard(true)

    expect(screen.getAllByText('Current')).toHaveLength(1)
  })

  it('opens the Guardian signup from the add-on row and counts the click', () => {
    renderCard(true)

    fireEvent.click(screen.getByRole('button', { name: 'Learn more' }))

    expect(screen.getByTestId('hn-signup-flow')).toBeInTheDocument()
    expect(trackEvent).toHaveBeenCalledWith(
      { ...SAFE_PRO_EVENTS.PLANS_CLICKED, label: 'discuss_add_on' },
      { CTA: 'discuss_add_on', Location: 'plans_page' },
    )
  })
})
