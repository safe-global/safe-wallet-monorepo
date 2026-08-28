import { fireEvent, render, screen, within } from '@/tests/test-utils'
import {
  asActivePolicy,
  mockMultiSpenderPolicy,
  mockPendingPolicy,
  mockPolicies,
  mockProposerPolicy,
  mockUnenforcedPolicy,
} from '../../mocks/policies'
import PoliciesTable from '../index'

describe('PoliciesTable', () => {
  it('should, when given policies, render the columns the design specifies', () => {
    render(<PoliciesTable policies={mockPolicies()} />)

    expect(screen.getByRole('columnheader', { name: 'RULE' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'APPLIES TO' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'NETWORK' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'TOKENS' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'STATUS' })).toBeInTheDocument()
  })

  it('should, when a spending limit holds three spenders, render one row rather than three', () => {
    render(<PoliciesTable policies={[asActivePolicy(mockMultiSpenderPolicy())]} />)

    expect(screen.getAllByTestId('policy-cell-rule')).toHaveLength(1)
  })

  it('should, when given a spending limit, derive its rule label and summary from the policy', () => {
    render(<PoliciesTable policies={[asActivePolicy(mockMultiSpenderPolicy())]} />)

    const cell = screen.getByTestId('policy-cell-rule')

    expect(within(cell).getByText('Spending limit')).toBeInTheDocument()
    expect(within(cell).getByText('3 spenders · 4 limits')).toBeInTheDocument()
  })

  it('should, when given several policies, render a row for each of them', () => {
    render(<PoliciesTable policies={mockPolicies()} />)

    expect(screen.getAllByTestId('policy-cell-rule')).toHaveLength(5)
  })

  it('should, when a policy module is present but not enabled, render it as not enforced', () => {
    render(<PoliciesTable policies={[asActivePolicy(mockUnenforcedPolicy())]} />)

    expect(screen.getByTestId('policy-status-unenforced')).toHaveTextContent('Not enforced')
    expect(screen.queryByTestId('policy-status-active')).not.toBeInTheDocument()
  })

  it('should, when a policy is awaiting execution, render it as pending', () => {
    render(<PoliciesTable policies={[mockPendingPolicy()]} />)

    expect(screen.getByTestId('policy-status-pending')).toHaveTextContent('Pending')
  })

  it('should, when the policy is a proposer grant, render no token icons', () => {
    render(<PoliciesTable policies={[asActivePolicy(mockProposerPolicy())]} />)

    expect(screen.queryByTestId('policy-tokens')).not.toBeInTheDocument()
  })

  it('should, when the policy is a spending limit, render its token icons', () => {
    render(<PoliciesTable policies={[asActivePolicy(mockMultiSpenderPolicy())]} />)

    expect(screen.getByTestId('policy-tokens')).toBeInTheDocument()
  })

  it('should, when a row is clicked, report the policy it belongs to', () => {
    const onSelect = jest.fn()
    const policy = asActivePolicy(mockProposerPolicy())

    render(<PoliciesTable policies={[policy]} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open proposer policy details' }))

    expect(onSelect).toHaveBeenCalledWith(policy)
  })

  it('should, when a row is activated with the keyboard, report the policy it belongs to', () => {
    const onSelect = jest.fn()
    const policy = asActivePolicy(mockProposerPolicy())

    render(<PoliciesTable policies={[policy]} onSelect={onSelect} />)
    fireEvent.keyDown(screen.getByRole('button', { name: 'Open proposer policy details' }), { key: 'Enter' })

    expect(onSelect).toHaveBeenCalledWith(policy)
  })

  it('should, when no select handler is given, leave the rows inactive', () => {
    render(<PoliciesTable policies={[asActivePolicy(mockProposerPolicy())]} />)

    expect(screen.queryByRole('button', { name: 'Open proposer policy details' })).not.toBeInTheDocument()
  })
})
