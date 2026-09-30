import { useState } from 'react'
import { act, fireEvent, render, screen, within } from '@/tests/test-utils'
import { COMPARE_SECTIONS_V2, PAY_FEES_FROM_SAFE } from '../../planCatalog'
import CompareFeaturesCard, { VISIBLE_FEATURES } from '../CompareFeaturesCard'

const Harness = ({ currentPlan, initiallyExpanded = false }: { currentPlan?: string; initiallyExpanded?: boolean }) => {
  const [isExpanded, setExpanded] = useState(initiallyExpanded)
  return <CompareFeaturesCard currentPlanName={currentPlan} isExpanded={isExpanded} onExpandedChange={setExpanded} />
}

const sectionTitles = () =>
  screen
    .getAllByRole('columnheader')
    .filter((cell) => cell.getAttribute('scope') === 'colgroup')
    .map((cell) => cell.textContent)

describe('CompareFeaturesCard', () => {
  const originalResizeObserver = window.ResizeObserver

  afterEach(() => {
    jest.restoreAllMocks()
    window.ResizeObserver = originalResizeObserver
  })

  it('shows only the Operations section while collapsed', () => {
    render(<Harness />)

    expect(sectionTitles()).toEqual(['Operations'])
    COMPARE_SECTIONS_V2[0].rows.forEach((row) => expect(screen.getByText(row.feature)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /Compare all features/ })).toHaveAttribute('aria-expanded', 'false')
  })

  it('adds every other section from the Expand table button, then fades the button out', () => {
    render(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: 'Expand table' }))

    expect(sectionTitles()).toEqual(COMPARE_SECTIONS_V2.map((section) => section.title))
    expect(screen.getByRole('button', { name: /Compare all features/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.queryByRole('button', { name: 'Expand table' })).not.toBeInTheDocument()
    expect(screen.getByTestId('compare-features-fade')).toHaveAttribute('aria-hidden', 'true')
  })

  it('keeps the folded sections rendered for the animation but out of reach until expanded', () => {
    render(<Harness />)

    const folded = screen.getByText('Security', { selector: 'th' }).closest('tbody') as HTMLElement
    expect(folded).toHaveAttribute('inert')
    expect(folded).toHaveAttribute('aria-hidden', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Expand table' }))

    expect(folded).not.toHaveAttribute('inert')
    expect(folded).not.toHaveAttribute('aria-hidden')
  })

  it('collapses again from its header', () => {
    render(<Harness initiallyExpanded />)

    fireEvent.click(screen.getByRole('button', { name: /Compare all features/ }))

    expect(sectionTitles()).toEqual(['Operations'])
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
    expect(within(row).getByText('Soon')).toHaveAttribute('data-variant', 'subtle')
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

  it('keeps the current plan checks gray until the table is expanded', () => {
    render(<Harness currentPlan="Business" />)

    const members = screen.getByRole('rowheader', { name: 'Unlimited Workspace members' }).closest('tr') as HTMLElement
    within(members)
      .getAllByTestId('plan-feature-check')
      .forEach((check) => expect(check).not.toHaveClass('bg-foreground'))
  })

  it('draws the current plan column with dark checks and no tint once expanded', () => {
    render(<Harness currentPlan="Business" initiallyExpanded />)

    screen.getAllByRole('cell').forEach((cell) => expect(cell.className).not.toMatch(/bg-mint/))

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
    jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
      if (this.tagName === 'TBODY') return 100
      return heights.get(this.dataset.slot ?? '') ?? 0
    })
    jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      return { top: 0, bottom: this.tagName === 'TR' ? 150 : 0 } as DOMRect
    })
    render(<Harness />)

    const table = screen.getByTestId('compare-features-table')
    expect(table).toHaveStyle({ height: '150px' })

    fireEvent.click(screen.getByRole('button', { name: 'Expand table' }))

    expect(table).toHaveStyle({ height: '400px' })
  })

  it('measures the unconstrained content on expand, so growth while collapsed never clips, even before the observer fires', () => {
    const heights = new Map<string, number>([['table-container', 400]])
    jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
      if (this.tagName === 'TBODY') return 100
      if (this.dataset.testid === 'compare-features-table') return Number.parseFloat(this.style.height) || 0
      return heights.get(this.dataset.slot ?? '') ?? 0
    })
    jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      return { top: 0, bottom: this.tagName === 'TR' ? 150 : 0 } as DOMRect
    })
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    render(<Harness />)
    const table = screen.getByTestId('compare-features-table')

    heights.set('table-container', 520)
    fireEvent.click(screen.getByRole('button', { name: 'Expand table' }))

    expect(table).toHaveStyle({ height: '520px' })
  })

  it('keeps the first features readable while collapsed and hides the ones fading out', () => {
    render(<Harness />)

    const rows = COMPARE_SECTIONS_V2[0].rows
    rows
      .slice(0, VISIBLE_FEATURES)
      .forEach((row) => expect(screen.getByRole('rowheader', { name: row.feature })).toBeInTheDocument())
    rows
      .slice(VISIBLE_FEATURES)
      .forEach((row) => expect(screen.queryByRole('rowheader', { name: row.feature })).not.toBeInTheDocument())
  })

  it('pins the header once expanded and adds a glow to the current plan', () => {
    render(<Harness currentPlan="Business" />)
    const business = screen.getByRole('columnheader', { name: /^Business/ })
    expect(business.closest('thead')).not.toHaveClass('sticky')
    expect(business).not.toHaveClass('from-mint/15')

    fireEvent.click(screen.getByRole('button', { name: 'Expand table' }))

    expect(business.closest('thead')).toHaveClass('sticky', 'top-0')
    expect(screen.getByRole('columnheader', { name: 'Features' })).toBeVisible()
    expect(business).toHaveClass('from-mint/15')
    expect(within(business).getByText('Current')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /^Enterprise/ })).not.toHaveClass('from-mint/15')
  })

  it('adds the hairline shadow to the header only while it is pinned', () => {
    let report: IntersectionObserverCallback = () => {}
    const original = window.IntersectionObserver
    window.IntersectionObserver = class {
      constructor(callback: IntersectionObserverCallback) {
        report = callback
      }
      observe() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver
    const scrollTo = (isIntersecting: boolean, top: number) =>
      act(() =>
        report(
          [{ isIntersecting, boundingClientRect: { top } } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        ),
      )
    render(<Harness initiallyExpanded />)
    const header = screen.getByRole('columnheader', { name: /^Business/ }).closest('thead') as HTMLElement

    scrollTo(false, -20)
    expect(header).toHaveClass('shadow-hairline-lg')

    scrollTo(true, 40)
    expect(header).not.toHaveClass('shadow-hairline-lg')
    window.IntersectionObserver = original
  })
})
