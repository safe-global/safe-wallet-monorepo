import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SpaceAddressBook from '../index'
import { useIsAdmin, useIsInvited, useAddressBookSearch, useGetSpaceAddressBook } from '@/features/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useAppSelector } from '@/store'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
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
  useGetPrivateAddressBook: jest.fn(() => []),
  useGetAddressBookRequests: jest.fn(() => []),
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
jest.mock('../ActivityLog', () => {
  const ActivityLog = () => <div data-testid="activity-log" />
  return ActivityLog
})
jest.mock('../../SpaceActivityLog', () => {
  const SpaceActivityLog = () => <div data-testid="space-activity-log-mock" />
  return SpaceActivityLog
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

const mockAuditLogFeature = (enabled: boolean) => {
  ;(useHasFeature as jest.Mock).mockImplementation((feature: FEATURES) =>
    feature === FEATURES.SPACE_AUDIT_LOG ? enabled : true,
  )
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

  describe('activity tab', () => {
    beforeEach(() => {
      ;(useIsAdmin as jest.Mock).mockReturnValue(false)
      mockUserQuery(
        userBuilder()
          .with({ wallets: [walletBuilder().build()] })
          .build(),
      )
    })

    it('renders the audit-log feed when SPACE_AUDIT_LOG is enabled', async () => {
      mockAuditLogFeature(true)

      render(<SpaceAddressBook />)
      await userEvent.click(screen.getByRole('tab', { name: 'Activity log' }))

      expect(screen.getByTestId('space-activity-log-mock')).toBeInTheDocument()
      expect(screen.queryByTestId('activity-log')).not.toBeInTheDocument()
    })

    it('renders the legacy activity log when SPACE_AUDIT_LOG is disabled', async () => {
      mockAuditLogFeature(false)

      render(<SpaceAddressBook />)
      await userEvent.click(screen.getByRole('tab', { name: 'Activity log' }))

      expect(screen.getByTestId('activity-log')).toBeInTheDocument()
      expect(screen.queryByTestId('space-activity-log-mock')).not.toBeInTheDocument()
    })
  })
})
