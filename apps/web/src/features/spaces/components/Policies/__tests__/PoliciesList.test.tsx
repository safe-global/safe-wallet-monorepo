import { fireEvent, render, renderWithUserEvent, screen } from '@/tests/test-utils'
import {
  asActivePolicy,
  mockMultiSpenderPolicy,
  mockPendingPolicy,
  mockPolicies,
  mockProposerPolicy,
  mockUnenforcedPolicy,
} from '../mocks/policies'
import PoliciesList from '../PoliciesList'

describe('PoliciesList', () => {
  it('should, when given policies, render the Add policy button, the search field and the sort control', () => {
    render(<PoliciesList policies={mockPolicies()} />)

    expect(screen.getByTestId('add-policy-button')).toHaveTextContent('Add policy')
    expect(screen.getByPlaceholderText('by name, address or network')).toBeInTheDocument()
    expect(screen.getByTestId('policies-sort')).toBeInTheDocument()
  })

  it('should, when a search matches one policy, render only that policy', () => {
    render(<PoliciesList policies={mockPolicies()} />)
    fireEvent.change(screen.getByPlaceholderText('by name, address or network'), { target: { value: 'Proposer' } })

    const rules = screen.getAllByTestId('policy-cell-rule')

    expect(rules).toHaveLength(1)
    expect(rules[0]).toHaveTextContent('Proposer')
  })

  it('should, when a search matches nothing, say so instead of rendering an empty table', () => {
    render(<PoliciesList policies={mockPolicies()} />)
    fireEvent.change(screen.getByPlaceholderText('by name, address or network'), { target: { value: 'zzzznothing' } })

    expect(screen.getByTestId('policies-no-results')).toHaveTextContent('No policies found')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('should, when the search is cleared, show every policy again', async () => {
    const { user } = renderWithUserEvent(<PoliciesList policies={mockPolicies()} />)

    await user.type(screen.getByPlaceholderText('by name, address or network'), 'zzzznothing')
    await user.click(screen.getByTestId('search-clear'))

    expect(screen.getByPlaceholderText('by name, address or network')).toHaveValue('')
    expect(screen.getAllByTestId('policy-cell-rule')).toHaveLength(mockPolicies().length)
  })

  it('should, when no sort is chosen, put the policies that need attention first', () => {
    render(
      <PoliciesList
        policies={[
          asActivePolicy(mockMultiSpenderPolicy()),
          asActivePolicy(mockUnenforcedPolicy()),
          mockPendingPolicy(),
        ]}
      />,
    )

    const statuses = screen.getAllByTestId('policy-cell-status')

    expect(statuses[0]).toHaveTextContent('Pending')
    expect(statuses[1]).toHaveTextContent('Not enforced')
    expect(statuses[2]).toHaveTextContent('Active')
  })

  it('should, when the space has proposers and spending limits, list both in one table under the proposer / tokens column', () => {
    render(<PoliciesList policies={[asActivePolicy(mockProposerPolicy()), asActivePolicy(mockMultiSpenderPolicy())]} />)

    const rules = screen.getAllByTestId('policy-cell-rule')

    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.getAllByRole('table')).toHaveLength(1)
    expect(rules.map((rule) => rule.textContent)).toEqual(
      expect.arrayContaining([expect.stringContaining('Proposer'), expect.stringContaining('Spending limit')]),
    )
    expect(screen.getByRole('columnheader', { name: 'PROPOSER / TOKENS' })).toBeInTheDocument()
  })

  it('should, when a type filter is picked, show only policies of that type', async () => {
    const { user } = renderWithUserEvent(<PoliciesList policies={mockPolicies()} />)

    await user.click(screen.getByTestId('policies-filter-proposer'))

    const rules = screen.getAllByTestId('policy-cell-rule')

    expect(screen.getByTestId('policies-filter-proposer')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('policies-filter-spending-limit')).toHaveAttribute('aria-pressed', 'false')
    expect(rules).toHaveLength(1)
    expect(rules[0]).toHaveTextContent('Proposer')
  })

  it('should, when another type filter is picked, switch to that type', async () => {
    const { user } = renderWithUserEvent(<PoliciesList policies={mockPolicies()} />)

    await user.click(screen.getByTestId('policies-filter-proposer'))
    await user.click(screen.getByTestId('policies-filter-spending-limit'))

    const rules = screen.getAllByTestId('policy-cell-rule')

    expect(screen.getByTestId('policies-filter-proposer')).toHaveAttribute('aria-pressed', 'false')
    expect(rules.length).toBeGreaterThan(0)
    rules.forEach((rule) => expect(rule).toHaveTextContent('Spending limit'))
  })

  it('should, when the picked type filter is clicked again, show every policy', async () => {
    const { user } = renderWithUserEvent(<PoliciesList policies={mockPolicies()} />)

    await user.click(screen.getByTestId('policies-filter-proposer'))
    await user.click(screen.getByTestId('policies-filter-proposer'))

    expect(screen.getByTestId('policies-filter-proposer')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getAllByTestId('policy-cell-rule')).toHaveLength(mockPolicies().length)
  })

  it('should, when the space has no policies of the filtered type, say so instead of rendering an empty table', async () => {
    const { user } = renderWithUserEvent(<PoliciesList policies={[asActivePolicy(mockMultiSpenderPolicy())]} />)

    await user.click(screen.getByTestId('policies-filter-proposer'))

    expect(screen.getByTestId('policies-no-results')).toHaveTextContent('Nothing matches this filter.')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('should, when no sort is picked, label the sort control Sort with its icon', () => {
    render(<PoliciesList policies={mockPolicies()} />)

    const trigger = screen.getByTestId('policies-sort')

    expect(trigger).toHaveTextContent('Sort')
    expect(trigger.querySelector('svg.lucide-arrow-down-up')).toBeInTheDocument()
  })

  it('should, when the sort control opens, offer every sortable column', async () => {
    const { user } = renderWithUserEvent(<PoliciesList policies={mockPolicies()} />)

    await user.click(screen.getByTestId('policies-sort'))

    const options = await screen.findAllByRole('option')

    expect(options.map((option) => option.textContent)).toEqual(['Rule A–Z', 'Applies to', 'Network', 'Status'])
  })

  it('should, when a sort is picked, show its label and keep the icon', async () => {
    const { user } = renderWithUserEvent(<PoliciesList policies={mockPolicies()} />)

    await user.click(screen.getByTestId('policies-sort'))
    await user.click(await screen.findByRole('option', { name: 'Network' }))

    const trigger = screen.getByTestId('policies-sort')

    expect(trigger).toHaveTextContent('Network')
    expect(trigger.querySelector('svg.lucide-arrow-down-up')).toBeInTheDocument()
  })

  it('should, when Add policy is clicked, ask the caller to open the create flow', () => {
    const onAddPolicy = jest.fn()

    render(<PoliciesList policies={mockPolicies()} onAddPolicy={onAddPolicy} />)
    fireEvent.click(screen.getByTestId('add-policy-button'))

    expect(onAddPolicy).toHaveBeenCalledTimes(1)
  })
})
