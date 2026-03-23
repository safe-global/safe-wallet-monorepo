import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import type { SafeItem } from '@/hooks/safes'
import type { Account } from '../types'
import AccountsWidget from '../AccountsWidget'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: jest.fn(),
}))

const mockSafeItem = (chainId: string, address: string): SafeItem => ({
  chainId,
  address,
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
})

const mockAccounts: Account[] = [
  {
    name: 'My account',
    address: '0x8675309a19b00000000000000000000000000000',
    href: '/home?safe=eth:0x8675309a19b00000000000000000000000000000',
    safes: [
      mockSafeItem('1', '0x8675309a19b00000000000000000000000000000'),
      mockSafeItem('137', '0x8675309a19b00000000000000000000000000000'),
    ],
    fiatTotal: '39950000',
    owners: '3/5',
    subAccounts: [
      { chainId: '1', fiatTotal: '20000000', href: '/home?safe=eth:0x8675309a19b00000000000000000000000000000' },
      { chainId: '137', fiatTotal: '19950000', href: '/home?safe=matic:0x8675309a19b00000000000000000000000000000' },
    ],
  },
  {
    name: 'Treasury',
    address: '0xabcdef0123456789abcdef0123456789abcdef01',
    href: '/home?safe=eth:0xabcdef0123456789abcdef0123456789abcdef01',
    safes: [mockSafeItem('1', '0xabcdef0123456789abcdef0123456789abcdef01')],
    fiatTotal: '1200000',
    owners: '2/3',
  },
  {
    name: 'Vault',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    href: '/home?safe=eth:0x1234567890abcdef1234567890abcdef12345678',
    safes: [mockSafeItem('1', '0x1234567890abcdef1234567890abcdef12345678')],
    fiatTotal: '500000',
    owners: '1/1',
  },
]

describe('AccountsWidget', () => {
  it('renders the widget title', () => {
    render(<AccountsWidget accounts={[]} />)

    expect(screen.getByText('Accounts')).toBeInTheDocument()
  })

  it('renders account items with name, address, and owners', () => {
    render(<AccountsWidget accounts={mockAccounts} />)

    expect(screen.getByText('My account')).toBeInTheDocument()
    expect(screen.getByText('0x8675...0000')).toBeInTheDocument()

    expect(screen.getByText('Treasury')).toBeInTheDocument()
    expect(screen.getByText('0xabcd...ef01')).toBeInTheDocument()
    expect(screen.getByText('2/3')).toBeInTheDocument()

    expect(screen.getByText('Vault')).toBeInTheDocument()
    expect(screen.getByText('1/1')).toBeInTheDocument()
  })

  it('renders an identicon for each account', () => {
    const { container } = render(<AccountsWidget accounts={mockAccounts} />)

    const avatars = container.querySelectorAll('[data-slot="avatar"]')
    expect(avatars).toHaveLength(mockAccounts.length)
  })

  it('renders skeletons when loading', () => {
    const { container } = render(<AccountsWidget accounts={[]} loading />)

    expect(screen.queryByText('My account')).not.toBeInTheDocument()

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders the footer with remaining count', () => {
    render(<AccountsWidget accounts={mockAccounts} remainingCount={14} />)

    expect(screen.getByText('View all accounts')).toBeInTheDocument()
  })

  it('does not render the footer when remainingCount is undefined', () => {
    render(<AccountsWidget accounts={mockAccounts} />)

    expect(screen.queryByText('View all accounts')).not.toBeInTheDocument()
  })

  it('does not render the footer when loading', () => {
    render(<AccountsWidget accounts={[]} loading remainingCount={14} />)

    expect(screen.queryByText('View all accounts')).not.toBeInTheDocument()
  })

  it('calls onViewAll when footer is clicked', async () => {
    const onViewAll = jest.fn()
    render(<AccountsWidget accounts={mockAccounts} remainingCount={14} onViewAll={onViewAll} />)

    await userEvent.click(screen.getByText('View all accounts'))

    expect(onViewAll).toHaveBeenCalledTimes(1)
  })

  it('renders a custom action node', () => {
    render(<AccountsWidget accounts={[]} action={<button>Custom action</button>} />)

    expect(screen.getByText('Custom action')).toBeInTheDocument()
  })

  it('renders an empty list when no accounts are provided', () => {
    render(<AccountsWidget accounts={[]} />)

    expect(screen.getByText('Accounts')).toBeInTheDocument()
    expect(screen.getByText('No accounts yet')).toBeInTheDocument()
    expect(screen.queryByText('View all accounts')).not.toBeInTheDocument()
  })

  it('renders the error state with error message', () => {
    render(<AccountsWidget accounts={[]} error="Failed to load accounts" />)

    expect(screen.getByText('Failed to load accounts')).toBeInTheDocument()
    expect(screen.queryByText('No accounts yet')).not.toBeInTheDocument()
  })

  it('renders the refresh button in error state when onRefresh is provided', () => {
    render(<AccountsWidget accounts={[]} error="Something went wrong" onRefresh={jest.fn()} />)

    expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument()
  })

  it('calls onRefresh when the refresh button is clicked', async () => {
    const onRefresh = jest.fn()
    render(<AccountsWidget accounts={[]} error="Something went wrong" onRefresh={onRefresh} />)

    await userEvent.click(screen.getByRole('button', { name: /reload page/i }))

    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('does not render accounts when in error state', () => {
    render(<AccountsWidget accounts={mockAccounts} error="Failed to load accounts" />)

    expect(screen.getByText('Failed to load accounts')).toBeInTheDocument()
    expect(screen.queryByText('My account')).not.toBeInTheDocument()
  })

  it('does not show error state while loading', () => {
    render(<AccountsWidget accounts={[]} loading error="Failed to load accounts" />)

    expect(screen.queryByText('Failed to load accounts')).not.toBeInTheDocument()
  })

  it('renders AccountItem.Balance with fiatTotal', () => {
    render(<AccountsWidget accounts={[mockAccounts[0]]} />)

    expect(screen.getByLabelText('$ 39,950,000.00')).toBeInTheDocument()
  })

  it('does not render balance when fiatTotal is undefined', () => {
    const accountWithoutBalance: Account[] = [{ ...mockAccounts[0], fiatTotal: undefined }]
    render(<AccountsWidget accounts={accountWithoutBalance} />)

    expect(screen.queryByLabelText(/39,950,000/)).not.toBeInTheDocument()
  })

  it('navigates to the safe home when a single-chain account is clicked', async () => {
    const mockPush = jest.fn()
    render(<AccountsWidget accounts={[mockAccounts[1]]} />, {
      routerProps: { push: mockPush },
    })

    const item = screen.getByRole('button', { name: /Treasury/i })
    await userEvent.click(item)

    expect(mockPush).toHaveBeenCalledWith('/home?safe=eth:0xabcdef0123456789abcdef0123456789abcdef01')
  })

  it('expands a multi-chain account to show sub-items on click', async () => {
    render(<AccountsWidget accounts={[mockAccounts[0]]} />)

    // Sub-items should not be visible initially
    expect(screen.queryByText('Ethereum')).not.toBeInTheDocument()

    // Click the multi-chain account trigger
    const trigger = screen.getByRole('button', { name: /My account/i })
    await userEvent.click(trigger)

    // Sub-items should now be visible
    expect(screen.getByText('Ethereum')).toBeInTheDocument()
    expect(screen.getByText('Polygon')).toBeInTheDocument()
  })

  it('does not show expand behavior for single-chain accounts', () => {
    render(<AccountsWidget accounts={[mockAccounts[1]]} />)

    // Single-chain accounts should not have a collapsible trigger with chevron
    const trigger = screen.getByRole('button', { name: /Treasury/i })
    expect(trigger).toBeInTheDocument()

    // Should not have the collapsible data-slot
    expect(screen.queryByTestId('collapsible')).not.toBeInTheDocument()
  })

  it('calls onItemClick with safeAddress exactly once when a single-chain account row is clicked', async () => {
    const onItemClick = jest.fn()
    render(<AccountsWidget accounts={[mockAccounts[1]]} onItemClick={onItemClick} />, {
      routerProps: { push: jest.fn() },
    })

    await userEvent.click(screen.getByRole('button', { name: /Treasury/i }))

    expect(onItemClick).toHaveBeenCalledTimes(1)
    expect(onItemClick).toHaveBeenCalledWith(mockAccounts[1].address)
  })

  it('calls onItemClick with safeAddress exactly once when a sub-account row is clicked', async () => {
    const onItemClick = jest.fn()
    render(<AccountsWidget accounts={[mockAccounts[0]]} onItemClick={onItemClick} />, {
      routerProps: { push: jest.fn() },
    })

    await userEvent.click(screen.getByRole('button', { name: /My account/i }))

    const subAccountRows = screen.getAllByTestId('sub-account-row')
    await userEvent.click(subAccountRows[0])

    expect(onItemClick).toHaveBeenCalledTimes(1)
    expect(onItemClick).toHaveBeenCalledWith(mockAccounts[0].address)
  })

  it('navigates to chain-specific safe when a sub-item is clicked', async () => {
    const mockPush = jest.fn()
    render(<AccountsWidget accounts={[mockAccounts[0]]} />, {
      routerProps: { push: mockPush },
    })

    // Expand the multi-chain account
    const trigger = screen.getByRole('button', { name: /My account/i })
    await userEvent.click(trigger)

    const subAccountRows = screen.getAllByTestId('sub-account-row')
    await userEvent.click(subAccountRows[subAccountRows.length - 1])

    expect(mockPush).toHaveBeenCalled()
  })

  it('fires trackEvent with spaceId and safeAddress for both GA and Mixpanel exactly once on account row click', async () => {
    const spaceId = '123'
    const onItemClick = (safeAddress: string) => {
      trackEvent(
        { ...SPACE_EVENTS.ACCOUNTS_WIDGET_CLICKED, label: spaceId },
        {
          spaceId,
          [MixpanelEventParams.SAFE_ADDRESS]: safeAddress,
        },
      )
    }

    render(<AccountsWidget accounts={[mockAccounts[1]]} onItemClick={onItemClick} />, {
      routerProps: { push: jest.fn() },
    })

    await userEvent.click(screen.getByRole('button', { name: /Treasury/i }))

    expect(trackEvent).toHaveBeenCalledTimes(1)
    expect(trackEvent).toHaveBeenCalledWith(
      { ...SPACE_EVENTS.ACCOUNTS_WIDGET_CLICKED, label: spaceId },
      {
        spaceId,
        [MixpanelEventParams.SAFE_ADDRESS]: mockAccounts[1].address,
      },
    )
  })
})

describe('AccountsWidget – display name', () => {
  const address = '0x1234567890abcdef1234567890abcdef12345678'

  const makeAccount = (name: string): Account => ({
    name,
    address,
    href: `/home?safe=eth:${address}`,
    safes: [mockSafeItem('1', address)],
    fiatTotal: '100',
    owners: '1/1',
  })

  it('displays the resolved name from account.name', () => {
    render(<AccountsWidget accounts={[makeAccount('My Safe')]} />)

    expect(screen.getByText('My Safe')).toBeInTheDocument()
  })

  it('displays shortened address when name is a short address', () => {
    render(<AccountsWidget accounts={[makeAccount('0x1234...5678')]} />)

    expect(screen.getAllByText('0x1234...5678')).toHaveLength(2)
  })
})
