import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SpaceAddressBook from '../index'
import {
  useIsAdmin,
  useIsInvited,
  useAddressBookSearch,
  useSpaceAddressBookState,
  useAddressBookRequestsState,
} from '@/features/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useAppSelector } from '@/store'
import { useHasFeature } from '@/hooks/useChains'
import { Builder } from '@/tests/Builder'
import type { UserWithWallets, UserWallet } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { faker } from '@faker-js/faker'

jest.mock('@/store')
jest.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: jest.fn(() => false),
}))
const mockLocalAddressBooks = jest.fn(() => ({}) as Record<string, Record<string, string>>)
jest.mock('@/hooks/useAllAddressBooks', () => () => mockLocalAddressBooks())
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [] })),
  useHasFeature: jest.fn(() => true),
}))
jest.mock('@/features/spaces', () => ({
  useIsAdmin: jest.fn(),
  useIsInvited: jest.fn(() => false),
  useAddressBookSearch: jest.fn(() => []),
  useSpaceAddressBookState: jest.fn(),
  useAddressBookRequestsState: jest.fn(),
  useCurrentSpaceId: jest.fn(() => '1'),
}))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  useUsersGetWithWalletsV1Query: jest.fn(),
}))
jest.mock('../../InviteBanner/PreviewInvite', () => {
  const PreviewInvite = () => null
  return PreviewInvite
})
jest.mock('../SpaceAddressBookTable', () => {
  const SpaceAddressBookTable = ({
    entries,
    renderExtraAction,
  }: {
    entries: { address: string }[]
    renderExtraAction?: (entry: { address: string }, ctx: { isCompact: boolean }) => React.ReactNode
  }) => (
    <div data-testid="table">
      {entries.map((entry) => (
        <div key={entry.address} data-testid={`row-${entry.address}`}>
          {renderExtraAction?.(entry, { isCompact: false })}
        </div>
      ))}
    </div>
  )
  return SpaceAddressBookTable
})
jest.mock('../AddContact', () => {
  const AddContact = () => <button>Add contact</button>
  return AddContact
})
jest.mock('../Import', () => {
  const ImportAddressBook = () => <button>Import</button>
  return ImportAddressBook
})
jest.mock('../PendingRequestsTable', () => {
  const PendingRequestsTable = () => <div data-testid="pending-table" />
  return PendingRequestsTable
})

const SETTLED = { isLoading: false, isError: false }

const mockAddressBook = (state: Partial<ReturnType<typeof useSpaceAddressBookState>> = {}) => {
  ;(useSpaceAddressBookState as jest.Mock).mockReturnValue({
    items: [],
    ...SETTLED,
    refetch: jest.fn(),
    ...state,
  })
}

const mockRequests = (state: Partial<ReturnType<typeof useAddressBookRequestsState>> = {}) => {
  ;(useAddressBookRequestsState as jest.Mock).mockReturnValue({
    items: [],
    ...SETTLED,
    refetch: jest.fn(),
    ...state,
  })
}
const walletBuilder = () =>
  Builder.new<UserWallet>().with({
    id: faker.number.int(),
    address: faker.finance.ethereumAddress(),
  })

const userBuilder = () =>
  Builder.new<UserWithWallets>().with({
    id: faker.number.int(),
    status: 1,
    wallets: [],
  })

const mockUserQuery = (user: UserWithWallets | undefined) => {
  ;(useUsersGetWithWalletsV1Query as jest.Mock).mockReturnValue({ currentData: user })
}

describe('SpaceAddressBook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAppSelector as jest.Mock).mockReturnValue(true)
    ;(useIsInvited as jest.Mock).mockReturnValue(false)
    mockAddressBook()
    mockRequests()
    ;(useAddressBookSearch as jest.Mock).mockReturnValue([])
    ;(useHasFeature as jest.Mock).mockReturnValue(true)
    mockLocalAddressBooks.mockReturnValue({})
  })

  it('hides action buttons for non-admin users', () => {
    ;(useIsAdmin as jest.Mock).mockReturnValue(false)
    mockUserQuery(
      userBuilder()
        .with({ wallets: [walletBuilder().build()] })
        .build(),
    )

    render(<SpaceAddressBook />)

    expect(screen.queryByText('Import')).not.toBeInTheDocument()
    expect(screen.queryByText('Add contact')).not.toBeInTheDocument()
  })

  it('shows action buttons for admin users', () => {
    ;(useIsAdmin as jest.Mock).mockReturnValue(true)
    mockUserQuery(
      userBuilder()
        .with({ wallets: [walletBuilder().build()] })
        .build(),
    )

    render(<SpaceAddressBook />)

    expect(screen.getByText('Import')).toBeInTheDocument()
    expect(screen.getByText('Add contact')).toBeInTheDocument()
  })

  it('shows a reload state instead of an empty address book when the request fails', async () => {
    const refetch = jest.fn()
    ;(useIsAdmin as jest.Mock).mockReturnValue(true)
    mockAddressBook({ isError: true, refetch })
    mockUserQuery(userBuilder().build())

    render(<SpaceAddressBook />)

    expect(screen.queryByText('No contacts in this Workspace yet.')).not.toBeInTheDocument()
    expect(screen.getByTestId('address-book-error')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Reload' }))
    expect(refetch).toHaveBeenCalled()
  })

  it('does not report zero workspace contacts while the request is unresolved', () => {
    ;(useIsAdmin as jest.Mock).mockReturnValue(true)
    mockAddressBook({ isError: true })
    mockUserQuery(userBuilder().build())

    render(<SpaceAddressBook />)

    expect(screen.getByRole('tab', { name: /Workspace contacts/ })).not.toHaveTextContent('(0)')
  })

  it('shows a loading state while the address book request is in flight', () => {
    ;(useIsAdmin as jest.Mock).mockReturnValue(true)
    mockAddressBook({ isLoading: true })
    mockUserQuery(userBuilder().build())

    render(<SpaceAddressBook />)

    expect(screen.getByTestId('address-book-loading')).toBeInTheDocument()
    expect(screen.queryByText('No contacts in this Workspace yet.')).not.toBeInTheDocument()
  })

  it('keeps the local contacts tab usable while the workspace request fails', async () => {
    ;(useIsAdmin as jest.Mock).mockReturnValue(false)
    mockAddressBook({ isError: true })
    mockUserQuery(userBuilder().build())

    render(<SpaceAddressBook />)
    await userEvent.click(screen.getByRole('tab', { name: /Local contacts/ }))

    expect(screen.getByText("You haven't added any contacts yet.")).toBeInTheDocument()
  })

  it('shows a reload state on the pending tab when its request fails', async () => {
    const refetch = jest.fn()
    ;(useIsAdmin as jest.Mock).mockReturnValue(false)
    mockRequests({ isError: true, refetch })
    mockUserQuery(userBuilder().build())

    render(<SpaceAddressBook />)
    await userEvent.click(screen.getByRole('tab', { name: /Pending/ }))

    expect(screen.queryByTestId('pending-table')).not.toBeInTheDocument()
    expect(screen.getByTestId('pending-requests-error')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Reload' }))
    expect(refetch).toHaveBeenCalled()
  })

  it('does not report zero pending requests while the request is unresolved', () => {
    ;(useIsAdmin as jest.Mock).mockReturnValue(false)
    mockRequests({ isError: true })
    mockUserQuery(userBuilder().build())

    render(<SpaceAddressBook />)

    expect(screen.getByRole('tab', { name: /Pending/ })).not.toHaveTextContent('(0)')
  })

  it('offers no workspace action on a local contact while the Workspace book is unread', async () => {
    ;(useIsAdmin as jest.Mock).mockReturnValue(false)
    mockLocalAddressBooks.mockReturnValue({ '1': { '0xAAA': 'Alice' } })
    mockAddressBook({ isError: true })
    ;(useAddressBookSearch as jest.Mock).mockImplementation((contacts) => contacts)
    mockUserQuery(userBuilder().build())

    render(<SpaceAddressBook />)
    await userEvent.click(screen.getByRole('tab', { name: /Local contacts/ }))

    expect(screen.getByTestId('row-0xAAA')).toBeEmptyDOMElement()
  })

  it('marks a local contact as already shared once the Workspace book loads', async () => {
    ;(useIsAdmin as jest.Mock).mockReturnValue(false)
    mockLocalAddressBooks.mockReturnValue({ '1': { '0xAAA': 'Alice' } })
    mockAddressBook({ items: [{ address: '0xaaa', name: 'Alice', chainIds: ['1'] }] as never })
    ;(useAddressBookSearch as jest.Mock).mockImplementation((contacts) => contacts)
    mockUserQuery(userBuilder().build())

    render(<SpaceAddressBook />)
    await userEvent.click(screen.getByRole('tab', { name: /Local contacts/ }))

    expect(screen.getByText('Already shared')).toBeInTheDocument()
  })

  it('offers no request action while the pending requests are unread', async () => {
    ;(useIsAdmin as jest.Mock).mockReturnValue(false)
    mockLocalAddressBooks.mockReturnValue({ '1': { '0xAAA': 'Alice' } })
    mockRequests({ isError: true })
    ;(useAddressBookSearch as jest.Mock).mockImplementation((contacts) => contacts)
    mockUserQuery(userBuilder().build())

    render(<SpaceAddressBook />)
    await userEvent.click(screen.getByRole('tab', { name: /Local contacts/ }))

    expect(screen.getByTestId('row-0xAAA')).toBeEmptyDOMElement()
  })

  it('does not render an activity log tab', () => {
    ;(useIsAdmin as jest.Mock).mockReturnValue(false)
    mockUserQuery(
      userBuilder()
        .with({ wallets: [walletBuilder().build()] })
        .build(),
    )

    render(<SpaceAddressBook />)

    expect(screen.queryByRole('tab', { name: 'Activity log' })).not.toBeInTheDocument()
  })
})
