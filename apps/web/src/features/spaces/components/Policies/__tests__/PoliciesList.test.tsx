import { fireEvent, render, screen } from '@/tests/test-utils'
import {
  asActivePolicy,
  mockPendingPolicy,
  mockPolicies,
  mockRecoveryPolicy,
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

  it('should, when no sort is chosen, put the policies that need attention first', () => {
    render(
      <PoliciesList
        policies={[asActivePolicy(mockRecoveryPolicy()), asActivePolicy(mockUnenforcedPolicy()), mockPendingPolicy()]}
      />,
    )

    const statuses = screen.getAllByTestId('policy-cell-status')

    expect(statuses[0]).toHaveTextContent('Pending')
    expect(statuses[1]).toHaveTextContent('Not enforced')
    expect(statuses[2]).toHaveTextContent('Active')
  })

  it('should, when Add policy is clicked, ask the caller to open the create flow', () => {
    const onAddPolicy = jest.fn()

    render(<PoliciesList policies={mockPolicies()} onAddPolicy={onAddPolicy} />)
    fireEvent.click(screen.getByTestId('add-policy-button'))

    expect(onAddPolicy).toHaveBeenCalledTimes(1)
  })
})
