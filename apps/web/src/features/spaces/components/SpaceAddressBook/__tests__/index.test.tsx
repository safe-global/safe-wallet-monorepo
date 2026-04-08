import { render, screen } from '@testing-library/react'
import SpaceAddressBook from '../index'
import { useIsAdmin, useIsInvited, useAddressBookSearch, useGetSpaceAddressBook } from '@/features/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useAppSelector } from '@/store'
import { Builder } from '@/tests/Builder'
import type { UserWithWallets, UserWallet } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { faker } from '@faker-js/faker'

jest.mock('@/store')
jest.mock('@/features/spaces', () => ({
  useIsAdmin: jest.fn(),
  useIsInvited: jest.fn(() => false),
  useAddressBookSearch: jest.fn(() => []),
  useGetSpaceAddressBook: jest.fn(() => []),
}))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/users', () => ({
  useUsersGetWithWalletsV1Query: jest.fn(),
}))
jest.mock('../../InviteBanner/PreviewInvite', () => {
  const PreviewInvite = () => null
  return PreviewInvite
})
jest.mock('../../SearchInput', () => {
  const SearchInput = ({ onSearch }: { onSearch: (q: string) => void }) => (
    <input data-testid="search" onChange={(e) => onSearch(e.target.value)} />
  )
  return SearchInput
})
jest.mock('../SpaceAddressBookTable', () => {
  const SpaceAddressBookTable = () => <div data-testid="table" />
  return SpaceAddressBookTable
})
jest.mock('../EmptyAddressBook', () => {
  const EmptyAddressBook = () => <div data-testid="empty" />
  return EmptyAddressBook
})
jest.mock('../AddContact', () => {
  const AddContact = ({ disabled }: { disabled?: boolean }) => <button disabled={disabled}>Add contact</button>
  return AddContact
})
jest.mock('../Import', () => {
  const ImportAddressBook = ({ disabled }: { disabled?: boolean }) => <button disabled={disabled}>Import</button>
  return ImportAddressBook
})

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
    ;(useGetSpaceAddressBook as jest.Mock).mockReturnValue([])
    ;(useAddressBookSearch as jest.Mock).mockReturnValue([])
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

  it('shows enabled action buttons for SIWE admin', () => {
    ;(useIsAdmin as jest.Mock).mockReturnValue(true)
    mockUserQuery(
      userBuilder()
        .with({ wallets: [walletBuilder().build()] })
        .build(),
    )

    render(<SpaceAddressBook />)

    expect(screen.getByText('Import')).not.toBeDisabled()
    expect(screen.getByText('Add contact')).not.toBeDisabled()
  })

  it('shows disabled action buttons for OIDC admin without wallet', () => {
    ;(useIsAdmin as jest.Mock).mockReturnValue(true)
    mockUserQuery(userBuilder().build())

    render(<SpaceAddressBook />)

    expect(screen.getByText('Import')).toBeDisabled()
    expect(screen.getByText('Add contact')).toBeDisabled()
  })

  it('shows disabled action buttons when user data is not yet loaded', () => {
    ;(useIsAdmin as jest.Mock).mockReturnValue(true)
    mockUserQuery(undefined)

    render(<SpaceAddressBook />)

    expect(screen.getByText('Import')).toBeDisabled()
    expect(screen.getByText('Add contact')).toBeDisabled()
  })
})
