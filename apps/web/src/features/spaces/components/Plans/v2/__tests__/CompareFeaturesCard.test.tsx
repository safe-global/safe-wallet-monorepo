import { useState } from 'react'
import { fireEvent, render, screen, within } from '@/tests/test-utils'
import { COMPARE_SECTIONS_V2, PAY_FEES_FROM_SAFE } from '../../planCatalog'
import CompareFeaturesCard from '../CompareFeaturesCard'

const Harness = ({ currentPlan, initiallyExpanded = false }: { currentPlan?: string; initiallyExpanded?: boolean }) => {
  const [isExpanded, setExpanded] = useState(initiallyExpanded)
  return <CompareFeaturesCard currentPlan={currentPlan} isExpanded={isExpanded} onExpandedChange={setExpanded} />
}

const sectionTitles = () =>
  screen
    .getAllByRole('columnheader')
    .filter((cell) => cell.getAttribute('scope') === 'colgroup')
    .map((cell) => cell.textContent)

describe('CompareFeaturesCard', () => {
  it('shows only the Every Pro plan section while collapsed', () => {
    render(<Harness />)

    expect(sectionTitles()).toEqual(['Every Pro plan'])
    COMPARE_SECTIONS_V2[0].rows.forEach((row) => expect(screen.getByText(row.feature)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /Compare all features/ })).toHaveAttribute('aria-expanded', 'false')
  })

  it('adds every other section from the Show all features button, then drops the button', () => {
    render(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: 'Show all features' }))

    expect(sectionTitles()).toEqual(COMPARE_SECTIONS_V2.map((section) => section.title))
    expect(screen.getByRole('button', { name: /Compare all features/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.queryByRole('button', { name: 'Show all features' })).not.toBeInTheDocument()
  })

  it('keeps the folded sections rendered for the animation but out of reach until expanded', () => {
    render(<Harness />)

    const folded = screen.getByText('Security', { selector: 'th' }).closest('tbody') as HTMLElement
    expect(folded).toHaveAttribute('inert')
    expect(folded).toHaveAttribute('aria-hidden', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Show all features' }))

    expect(folded).not.toHaveAttribute('inert')
    expect(folded).not.toHaveAttribute('aria-hidden')
  })

  it('collapses again from its header', () => {
    render(<Harness initiallyExpanded />)

    fireEvent.click(screen.getByRole('button', { name: /Compare all features/ }))

    expect(sectionTitles()).toEqual(['Every Pro plan'])
  })

  it.each(['Starter', 'Business', 'Enterprise'])(
    'marks the %s column as current when it is the plan in force',
    (plan) => {
      render(<Harness currentPlan={plan} />)

      const header = screen.getByRole('columnheader', { name: new RegExp(`^${plan}`) })
      expect(within(header).getByText('Current')).toBeInTheDocument()
      expect(screen.getAllByText('Current')).toHaveLength(1)
    },
  )

  it('marks no column without a plan in force', () => {
    render(<Harness />)

    expect(screen.queryByText('Current')).not.toBeInTheDocument()
  })

  it('lists the fee payment only as a coming-soon row', () => {
    render(<Harness initiallyExpanded />)

    const row = screen.getByRole('rowheader', { name: new RegExp(PAY_FEES_FROM_SAFE) })
    expect(within(row).getByText('Soon')).toBeInTheDocument()
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

  it('draws included features with the 20px circle check', () => {
    render(<Harness />)

    const members = screen.getByRole('rowheader', { name: 'Unlimited Workspace members' }).closest('tr') as HTMLElement
    expect(within(members).getAllByTestId('plan-feature-check')).toHaveLength(3)
  })

  it('draws the current plan column with dark checks so they stand out on the mint tint', () => {
    render(<Harness currentPlan="Business" />)

    const members = screen.getByRole('rowheader', { name: 'Unlimited Workspace members' }).closest('tr') as HTMLElement
    expect(
      within(members)
        .getAllByTestId('plan-feature-check')
        .map((check) => check.classList.contains('bg-foreground')),
    ).toEqual([false, true, false])
  })

  it('eases the table between its collapsed and full measured heights', () => {
    const heights = new Map<string, number>([
      ['table-container', 400],
      ['table', 400],
    ])
    const height = jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.tagName === 'TBODY') return 100
      return heights.get(this.dataset.slot ?? '') ?? 0
    })
    const top = jest.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(() => 50)
    render(<Harness />)

    const table = screen.getByTestId('compare-features-table')
    expect(table).toHaveStyle({ height: '150px' })

    fireEvent.click(screen.getByRole('button', { name: 'Show all features' }))

    expect(table).toHaveStyle({ height: '400px' })
    height.mockRestore()
    top.mockRestore()
  })

  it('measures the unconstrained content on expand, so growth while collapsed never clips, even before the observer fires', () => {
    const heights = new Map<string, number>([['table-container', 400]])
    const height = jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.tagName === 'TBODY') return 100
      if (this.dataset.testid === 'compare-features-table') return Number.parseFloat(this.style.height) || 0
      return heights.get(this.dataset.slot ?? '') ?? 0
    })
    const top = jest.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(() => 50)
    const original = window.ResizeObserver
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    render(<Harness />)
    const table = screen.getByTestId('compare-features-table')

    heights.set('table-container', 520)
    fireEvent.click(screen.getByRole('button', { name: 'Show all features' }))

    expect(table).toHaveStyle({ height: '520px' })
    window.ResizeObserver = original
    height.mockRestore()
    top.mockRestore()
  })
})
