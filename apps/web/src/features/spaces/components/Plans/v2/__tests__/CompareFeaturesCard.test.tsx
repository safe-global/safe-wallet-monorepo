import { useState } from 'react'
import { fireEvent, render, screen, within } from '@/tests/test-utils'
import CompareFeaturesCard from '../CompareFeaturesCard'

const Harness = ({ currentPlan, initiallyExpanded = false }: { currentPlan?: string; initiallyExpanded?: boolean }) => {
  const [isExpanded, setExpanded] = useState(initiallyExpanded)
  return <CompareFeaturesCard currentPlanName={currentPlan} isExpanded={isExpanded} onExpandedChange={setExpanded} />
}

const toggle = () => screen.getByRole('button', { name: /Compare all features/ })

describe('CompareFeaturesCard', () => {
  it('expands from the Expand table button and collapses again from its header', () => {
    render(<Harness />)
    expect(toggle()).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(screen.getByRole('button', { name: 'Expand table' }))
    expect(toggle()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.queryByRole('button', { name: 'Expand table' })).not.toBeInTheDocument()

    fireEvent.click(toggle())
    expect(toggle()).toHaveAttribute('aria-expanded', 'false')
  })

  it('keeps the folded sections out of reach until expanded', () => {
    render(<Harness />)

    const folded = screen.getByText('Security & Safe Shield', { selector: 'th' }).closest('tbody') as HTMLElement
    expect(folded).toHaveAttribute('inert')
    expect(folded).toHaveAttribute('aria-hidden', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Expand table' }))

    expect(folded).not.toHaveAttribute('inert')
    expect(folded).not.toHaveAttribute('aria-hidden')
  })

  it('marks only the column of the plan in force as current', () => {
    const { unmount } = render(<Harness currentPlan="Business" />)

    expect(within(screen.getByRole('columnheader', { name: /^Business/ })).getByText('Current')).toBeInTheDocument()
    expect(screen.getAllByText('Current')).toHaveLength(1)
    unmount()

    render(<Harness />)
    expect(screen.queryByText('Current')).not.toBeInTheDocument()
  })

  it('names included and missing features for screen readers', () => {
    render(<Harness initiallyExpanded />)

    const proposers = screen.getByRole('rowheader', { name: 'Transaction proposers' }).closest('tr') as HTMLElement
    expect(
      within(proposers)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['—Not included', 'Included', 'Included'])
  })
})
