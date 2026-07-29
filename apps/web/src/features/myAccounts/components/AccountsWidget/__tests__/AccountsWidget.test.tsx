import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import type { SafeItem } from '@/hooks/safes'
import AccountsWidget from '../AccountsWidget'

// The widget delegates row rendering to the shared SafeAccountsTable (covered by its own tests).
// Here we stub it to a lightweight list so we can assert the widget's own chrome and wiring.
jest.mock('../../SafeAccountsTable', () => ({
  __esModule: true,
  default: ({
    items,
    onLinkClick,
  }: {
    items: Array<{ address: string; name?: string }>
    onLinkClick?: (line: { address: string }) => void
  }) => (
    <div data-testid="safe-accounts-table">
      {items.map((item) => (
        <button key={item.address} data-testid="table-row" onClick={() => onLinkClick?.({ address: item.address })}>
          {item.name ?? item.address}
        </button>
      ))}
    </div>
  ),
}))

const mockItem = (address: string, name?: string): SafeItem => ({
  chainId: '1',
  address,
  name,
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
})

const mockItems: SafeItem[] = [
  mockItem('0x8675309a19b00000000000000000000000000000', 'My account'),
  mockItem('0xabcdef0123456789abcdef0123456789abcdef01', 'Treasury'),
  mockItem('0x1234567890abcdef1234567890abcdef12345678', 'Vault'),
]

describe('AccountsWidget', () => {
  it('renders the widget title', () => {
    render(<AccountsWidget items={[]} />)

    expect(screen.getByText('Accounts')).toBeInTheDocument()
  })

  it('renders the shared accounts table with the provided items', () => {
    render(<AccountsWidget items={mockItems} />)

    expect(screen.getByTestId('safe-accounts-table')).toBeInTheDocument()
    expect(screen.getByText('My account')).toBeInTheDocument()
    expect(screen.getByText('Treasury')).toBeInTheDocument()
    expect(screen.getByText('Vault')).toBeInTheDocument()
  })

  it('renders skeletons while loading with no items yet', () => {
    const { container } = render(<AccountsWidget items={[]} loading />)

    expect(screen.queryByTestId('safe-accounts-table')).not.toBeInTheDocument()
    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it('renders the "View all" action with the overflow count (+N) when accounts are hidden', () => {
    // 3 accounts displayed out of 17 total → 14 hidden.
    render(<AccountsWidget items={mockItems} totalCount={17} onViewAll={jest.fn()} />)

    expect(screen.getByText('View all')).toBeInTheDocument()
    expect(screen.getByText('+14')).toBeInTheDocument()
  })

  it('renders "View all" without an overflow badge when all accounts are displayed', () => {
    render(<AccountsWidget items={mockItems} totalCount={mockItems.length} onViewAll={jest.fn()} />)

    expect(screen.getByText('View all')).toBeInTheDocument()
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument()
  })

  it('does not render the "View all" action when onViewAll is not provided', () => {
    render(<AccountsWidget items={mockItems} totalCount={17} />)

    expect(screen.queryByText('View all')).not.toBeInTheDocument()
  })

  it('does not render "View all" in the empty state even when onViewAll is provided', () => {
    render(<AccountsWidget items={[]} onViewAll={jest.fn()} />)

    expect(screen.queryByText('View all')).not.toBeInTheDocument()
  })

  it('calls onViewAll when the "View all" action is clicked', async () => {
    const onViewAll = jest.fn()
    render(<AccountsWidget items={mockItems} totalCount={17} onViewAll={onViewAll} />)

    await userEvent.click(screen.getByText('View all'))

    expect(onViewAll).toHaveBeenCalledTimes(1)
  })

  it('calls onItemClick with the safe address when a row is clicked', async () => {
    const onItemClick = jest.fn()
    render(<AccountsWidget items={mockItems} onItemClick={onItemClick} />)

    await userEvent.click(screen.getByText('Treasury'))

    expect(onItemClick).toHaveBeenCalledTimes(1)
    expect(onItemClick).toHaveBeenCalledWith(mockItems[1].address)
  })

  it('renders the empty state when no accounts are provided', () => {
    render(<AccountsWidget items={[]} />)

    expect(screen.getByText('No accounts yet')).toBeInTheDocument()
    expect(screen.getByText('Add your Safe accounts to view balances and manage transactions.')).toBeInTheDocument()
    expect(screen.queryByTestId('safe-accounts-table')).not.toBeInTheDocument()
  })

  it('renders the empty state action when provided', () => {
    render(<AccountsWidget items={[]} emptyStateAction={<button>Add account</button>} />)

    expect(screen.getByRole('button', { name: 'Add account' })).toBeInTheDocument()
  })

  it('renders the error state with error message and hides the table', () => {
    render(<AccountsWidget items={mockItems} error="Failed to load accounts" />)

    expect(screen.getByText('Failed to load accounts')).toBeInTheDocument()
    expect(screen.queryByText('No accounts yet')).not.toBeInTheDocument()
    expect(screen.queryByTestId('safe-accounts-table')).not.toBeInTheDocument()
  })

  it('renders the refresh button in error state and calls onRefresh when clicked', async () => {
    const onRefresh = jest.fn()
    render(<AccountsWidget items={[]} error="Something went wrong" onRefresh={onRefresh} />)

    await userEvent.click(screen.getByRole('button', { name: /reload page/i }))

    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('does not show the error state while loading', () => {
    render(<AccountsWidget items={[]} loading error="Failed to load accounts" />)

    expect(screen.queryByText('Failed to load accounts')).not.toBeInTheDocument()
  })
})
