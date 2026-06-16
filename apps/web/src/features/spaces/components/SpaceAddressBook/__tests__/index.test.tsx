import { render, screen } from '@testing-library/react'
import SpaceAddressBook from '../index'
import { useIsAdmin, useIsInvited, useAddressBookSearch, useGetSpaceAddressBook } from '@/features/spaces'
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
jest.mock('@/hooks/useAllAddressBooks', () => jest.fn(() => ({})))
jest.mock('@/hooks/useChains', () => ({
  useHasFeature: jest.fn(() => true),
}))
jest.mock('@/features/spaces', () => ({
  useIsAdmin: jest.fn(),
  useIsInvited: jest.fn(() => false),
  useAddressBookSearch: jest.fn(() => []),
  useGetSpaceAddressBook: jest.fn(() => []),
  useGetAddressBookRequests: jest.fn(() => []),
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
  const SpaceAddressBookTable = () => <div data-testid="table" />
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
    ;(useHasFeature as jest.Mock).mockReturnValue(true)
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
