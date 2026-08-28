import { fireEvent, render, screen } from '@/tests/test-utils'
import { asActivePolicy, mockPolicies, mockProposerPolicy, mockRecoveryPolicy } from '../mocks/policies'
import PoliciesList from '../PoliciesList'

describe('PoliciesList', () => {
  it('should, when given policies, render the Add policy button, the search field and the sort control', () => {
    render(<PoliciesList policies={mockPolicies()} />)

    expect(screen.getByTestId('add-policy-button')).toHaveTextContent('Add policy')
    expect(screen.getByPlaceholderText('by name, address or network')).toBeInTheDocument()
    expect(screen.getByTestId('policies-sort')).toBeInTheDocument()
  })

  it('should, when the policies are still loading, render the loading state and no table', () => {
    render(<PoliciesList policies={[]} isLoading />)

    expect(screen.getByTestId('policies-loading')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('should, when the policies failed to load, render the error state and no table', () => {
    render(<PoliciesList policies={mockPolicies()} isError />)

    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load policies")
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('should, when Try again is clicked in the error state, ask the caller to reload', () => {
    const onRetry = jest.fn()

    render(<PoliciesList policies={[]} isError onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
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

  it('should, when no sort is chosen, order the rows with the most recently created policy first', () => {
    render(<PoliciesList policies={[asActivePolicy(mockRecoveryPolicy()), asActivePolicy(mockProposerPolicy())]} />)

    const rules = screen.getAllByTestId('policy-cell-rule')

    expect(rules[0]).toHaveTextContent('Proposer')
    expect(rules[1]).toHaveTextContent('Account recovery')
  })

  it('should, when Add policy is clicked, ask the caller to open the create flow', () => {
    const onAddPolicy = jest.fn()

    render(<PoliciesList policies={mockPolicies()} onAddPolicy={onAddPolicy} />)
    fireEvent.click(screen.getByTestId('add-policy-button'))

    expect(onAddPolicy).toHaveBeenCalledTimes(1)
  })
})
