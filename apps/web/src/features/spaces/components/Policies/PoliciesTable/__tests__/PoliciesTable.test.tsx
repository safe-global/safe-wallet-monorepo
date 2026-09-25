import { fireEvent, render, screen, within } from '@/tests/test-utils'
import {
  MOCK_SAFES,
  asActivePolicy,
  mockMultiSpenderPolicy,
  mockPendingPolicy,
  mockPolicies,
  mockPolygonSpendingLimitPolicy,
  mockProposerPolicy,
  mockUnenforcedPolicy,
} from '../../mocks/policies'
import PoliciesTable from '../index'

const mockResolveSafeName = jest.fn()

jest.mock('@/hooks/useAllAddressBooks', () => ({
  useAddressBookItem: () => undefined,
  useSafeNameResolver: () => mockResolveSafeName,
}))

describe('PoliciesTable', () => {
  beforeEach(() => {
    mockResolveSafeName.mockReturnValue('')
  })

  it('should, when the Safe has a name in the space, show it in the applies to column', () => {
    mockResolveSafeName.mockImplementation((address: string) =>
      address === MOCK_SAFES.treasury.address ? 'Treasury' : '',
    )

    render(<PoliciesTable policies={[asActivePolicy(mockProposerPolicy())]} />)

    expect(within(screen.getByTestId('policy-cell-applies-to')).getByText('Treasury')).toBeInTheDocument()
  })

  it('should, when given policies, render the columns the design specifies', () => {
    render(<PoliciesTable policies={mockPolicies()} />)

    expect(screen.getByRole('columnheader', { name: 'RULE' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'APPLIES TO' })).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'RULE',
      'APPLIES TO',
      'PROPOSER / TOKENS',
      'NETWORK',
      'STATUS',
      '',
    ])
  })

  it('should, when given a proposer policy, show the proposer with its grant label in the proposer / tokens column', () => {
    render(<PoliciesTable policies={[asActivePolicy(mockProposerPolicy())]} />)

    const cell = screen.getByTestId('policy-cell-proposer-tokens')

    expect(within(cell).getByText('Bob')).toBeInTheDocument()
    expect(within(cell).queryByTestId('policy-tokens')).not.toBeInTheDocument()
  })

  it('should, when given a spending limit, show its tokens in the proposer / tokens column', () => {
    render(<PoliciesTable policies={[asActivePolicy(mockMultiSpenderPolicy())]} />)

    expect(within(screen.getByTestId('policy-cell-proposer-tokens')).getByTestId('policy-tokens')).toBeInTheDocument()
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

  it('should, when given several policies, render a row for each one', () => {
    render(<PoliciesTable policies={mockPolicies()} />)

    expect(screen.getAllByTestId('policy-cell-rule')).toHaveLength(6)
  })

  it('should, when the same Safe has the policy on two chains, render one row per chain', () => {
    render(
      <PoliciesTable
        policies={[asActivePolicy(mockMultiSpenderPolicy()), asActivePolicy(mockPolygonSpendingLimitPolicy())]}
      />,
    )

    expect(screen.getAllByTestId('policy-cell-rule')).toHaveLength(2)
    expect(screen.getAllByTestId('policy-cell-network')).toHaveLength(2)
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
    fireEvent.click(screen.getByTestId('policy-cell-rule'))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(policy)
  })

  it('should, when the open button is used, report the policy it belongs to once', () => {
    const onSelect = jest.fn()
    const policy = asActivePolicy(mockProposerPolicy())

    render(<PoliciesTable policies={[policy]} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'Open Proposer for 0x8675...a19b' }))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(onSelect).toHaveBeenCalledWith(policy)
  })

  it('should, when rows are selectable, name each open button after its rule and Safe', () => {
    render(
      <PoliciesTable
        policies={[asActivePolicy(mockProposerPolicy()), asActivePolicy(mockMultiSpenderPolicy())]}
        onSelect={jest.fn()}
      />,
    )

    expect(screen.getByRole('button', { name: 'Open Proposer for 0x8675...a19b' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open Spending limit for 0x8675...a19b' })).toBeInTheDocument()
  })

  it('should, when rows are selectable, keep them table rows rather than buttons', () => {
    render(<PoliciesTable policies={[asActivePolicy(mockProposerPolicy())]} onSelect={jest.fn()} />)

    expect(screen.getAllByRole('row')[1]).not.toHaveAttribute('role', 'button')
  })

  it('should, when no select handler is given, render no open button', () => {
    render(<PoliciesTable policies={[asActivePolicy(mockProposerPolicy())]} />)

    expect(screen.queryByTestId('policy-open-button')).not.toBeInTheDocument()
  })
})
