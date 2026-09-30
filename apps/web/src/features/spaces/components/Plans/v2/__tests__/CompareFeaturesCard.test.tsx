import { useState } from 'react'
import { fireEvent, render, screen, within } from '@/tests/test-utils'
import { COMPARE_SECTIONS_V2, PAY_FEES_FROM_SAFE, SAFENET_CHECKS } from '../../planCatalog'
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

  it('previews the sections at the top of the table while collapsed', () => {
    render(<Harness />)

    expect(sectionTitles()).toEqual(['Coming soon', 'Operations'])
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

    expect(sectionTitles()).toEqual(['Coming soon', 'Operations'])
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

  it.each([
    [PAY_FEES_FROM_SAFE, ['Included', 'Included', 'Included']],
    [SAFENET_CHECKS, ['—Not included', 'Included', 'Included']],
    ['More policies', ['Included', 'Included', 'Included']],
  ])('groups %s at the top under Coming soon, showing which plans will get it', (feature, cells) => {
    render(<Harness initiallyExpanded />)

    expect(sectionTitles()[0]).toBe('Coming soon')
    const header = screen.getByRole('rowheader', { name: `${feature} Soon` })
    expect(within(header).getByText('Soon')).toHaveAttribute('data-variant', 'subtle')
    const row = header.closest('tr') as HTMLElement
    expect(
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(cells)
  })

  it('draws no divider under the last row', () => {
    render(<Harness initiallyExpanded />)

    const lastSection = screen.getByText('Add-ons', { selector: 'th' }).closest('tbody') as HTMLElement
    expect(lastSection.className).not.toMatch(/last-child\]:border-b/)
  })

  it('puts the Hypernative add-on last, in its own section', () => {
    render(<Harness initiallyExpanded />)

    expect(sectionTitles().at(-1)).toBe('Add-ons')
    const row = screen.getByRole('rowheader', { name: /Hypernative threat monitoring/ }).closest('tr') as HTMLElement
    expect(row).toHaveAttribute('data-add-on', 'true')
    expect(within(row).getByRole('link', { name: 'Discuss add-on' })).toBeInTheDocument()
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

    const rows = COMPARE_SECTIONS_V2.flatMap((section) => section.rows)
    rows
      .slice(0, VISIBLE_FEATURES)
      .forEach((row) =>
        expect(screen.getByRole('rowheader', { name: (name) => name.startsWith(row.feature) })).toBeInTheDocument(),
      )
    rows
      .slice(VISIBLE_FEATURES)
      .forEach((row) =>
        expect(
          screen.queryByRole('rowheader', { name: (name) => name.startsWith(row.feature) }),
        ).not.toBeInTheDocument(),
      )
  })

  it('pins a flat header once expanded, marking the current plan with its badge only', () => {
    render(<Harness currentPlan="Business" />)
    const business = screen.getByRole('columnheader', { name: /^Business/ })
    expect(business.closest('thead')).not.toHaveClass('sticky')

    fireEvent.click(screen.getByRole('button', { name: 'Expand table' }))

    const header = business.closest('thead') as HTMLElement
    expect(header).toHaveClass('sticky', 'top-0')
    expect(header.className).not.toMatch(/shadow/)
    expect(business.className).not.toMatch(/mint/)
    expect(within(business).getByText('Current')).toBeInTheDocument()
  })
})
