import { render, screen } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import PendingRequestsTable from '../PendingRequestsTable'
import type { AddressBookRequestItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Builder } from '@/tests/Builder'

const mockUseIsMobile = jest.fn(() => false)
jest.mock('@safe-global/views/hooks/use-mobile', () => ({ useIsMobile: () => mockUseIsMobile() }))
jest.mock('@/hooks/useChains', () => () => ({ configs: [] }))
const mockUseGetSpaceAddressBook = jest.fn((): { address: string }[] => [])
jest.mock('../../../public/hooks/useCurrentSpaceId', () => ({
  useCurrentSpaceId: () => '1',
}))
jest.mock('../../../public/hooks/useSpaceMembers', () => ({
  get MemberStatus() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').MemberStatus
  },
  get MEMBER_ALIAS_MAX_LENGTH() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').MEMBER_ALIAS_MAX_LENGTH
  },
  get getMemberDisplayName() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').getMemberDisplayName
  },
  get sanitizeMemberAlias() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').sanitizeMemberAlias
  },
  get isAdmin() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').isAdmin
  },
  get isActiveAdmin() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').isActiveAdmin
  },
  get isInviteExpired() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').isInviteExpired
  },
  get useSpaceMembersByStatus() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').useSpaceMembersByStatus
  },
  get useCurrentMembership() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').useCurrentMembership
  },
  get useCurrentMemberProfile() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').useCurrentMemberProfile
  },
  get useIsActiveMember() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').useIsActiveMember
  },
  get useIsInvited() {
    return jest.requireActual('../../../public/hooks/useSpaceMembers').useIsInvited
  },
  useIsAdmin: () => true,
}))
jest.mock('../../../public/hooks/useGetSpaceAddressBook', () => ({
  ...jest.requireActual('../../../public/hooks/useGetSpaceAddressBook'),
  __esModule: true,
  default: () => mockUseGetSpaceAddressBook(),
}))
const mockApprove = jest.fn()
const mockReject = jest.fn()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useAddressBookRequestsApproveRequestV1Mutation: () => [mockApprove],
  useAddressBookRequestsRejectRequestV1Mutation: () => [mockReject],
}))
jest.mock('@/store', () => ({
  useAppDispatch: () => jest.fn(),
}))
jest.mock('@/components/common/EthHashInfo', () => {
  const EthHashInfo = ({
    address,
    highlight4bytes,
    onlyName,
  }: {
    address: string
    highlight4bytes?: boolean
    onlyName?: boolean
  }) => (
    <span
      data-testid="eth-hash-info"
      data-highlight={String(Boolean(highlight4bytes))}
      data-only-name={String(Boolean(onlyName))}
    >
      {address}
    </span>
  )
  return EthHashInfo
})
jest.mock('@safe-global/views/components/common/Identicon', () => {
  const Identicon = ({ address }: { address: string }) => <span data-testid="identicon" data-address={address} />
  return Identicon
})
jest.mock('@/components/common/NetworkLogosTooltip', () => ({
  __esModule: true,
  default: ({ networks, trigger }: { networks: { chainId: string }[]; trigger?: React.ReactNode }) => (
    <span data-testid="network-logos" data-count={networks.length}>
      {trigger}
    </span>
  ),
}))
jest.mock('@/components/common/NetworkLogosPill', () => ({
  __esModule: true,
  default: ({ networks }: { networks: { chainId: string }[] }) => (
    <span data-testid="network-logos-pill" data-count={networks.length} />
  ),
}))
jest.mock('@/components/common/ChainIndicator', () => {
  const ChainIndicator = () => <span data-testid="chain-indicator" />
  return ChainIndicator
})

const requestBuilder = () =>
  Builder.new<AddressBookRequestItemDto>().with({
    id: faker.number.int(),
    name: faker.person.fullName(),
    address: faker.finance.ethereumAddress(),
    chainIds: ['1'],
    requestedBy: faker.finance.ethereumAddress(),
  })

describe('PendingRequestsTable', () => {
  beforeEach(() => {
    mockUseIsMobile.mockReturnValue(false)
    mockUseGetSpaceAddressBook.mockReturnValue([])
  })

  it('wraps the "Already in Workspace" badge below the name instead of squeezing it', () => {
    const request = requestBuilder().build()
    mockUseGetSpaceAddressBook.mockReturnValue([{ address: request.address.toUpperCase() }])

    render(<PendingRequestsTable requests={[request]} />)

    const badge = screen.getByText('Already in Workspace')
    expect(badge.parentElement).toHaveClass('flex-wrap')
    expect(badge.parentElement).toContainElement(screen.getByText(request.name))
  })

  it('truncates the name on desktop and wraps it on mobile, where the address column is gone', () => {
    const name = 'A very long contact name that would overflow the Name column'
    const request = requestBuilder().with({ name }).build()

    const { unmount } = render(<PendingRequestsTable requests={[request]} />)
    expect(screen.getByText(name)).toHaveClass('truncate')
    expect(screen.getByText('Address')).toBeInTheDocument()
    unmount()

    mockUseIsMobile.mockReturnValue(true)
    render(<PendingRequestsTable requests={[request]} />)
    expect(screen.getByText(name)).not.toHaveClass('truncate')
    expect(screen.queryByText('Address')).not.toBeInTheDocument()
  })

  it('moves the address under the name on mobile', () => {
    mockUseIsMobile.mockReturnValue(true)
    const request = requestBuilder().with({ requestedBy: faker.internet.email() }).build()

    render(<PendingRequestsTable requests={[request]} />)

    const nameCell = screen.getByText(request.name).closest('td')
    expect(nameCell).toContainElement(screen.getByTestId('eth-hash-info'))
    expect(screen.getByTestId('eth-hash-info')).toHaveTextContent(request.address)
  })

  it('renders a highlighted full address in the "Requested by" cell when requestedBy is an address', () => {
    const requestedBy = faker.finance.ethereumAddress()
    render(<PendingRequestsTable requests={[requestBuilder().with({ requestedBy }).build()]} />)

    const requestedByCell = screen.getAllByTestId('eth-hash-info').find((el) => el.textContent === requestedBy)
    expect(requestedByCell).toHaveAttribute('data-highlight', 'true')
    expect(requestedByCell).toHaveAttribute('data-only-name', 'false')
  })

  it('renders the full email as plain text in the "Requested by" cell when requestedBy is an email', () => {
    const requestedBy = faker.internet.email()
    render(<PendingRequestsTable requests={[requestBuilder().with({ requestedBy }).build()]} />)

    expect(screen.getByText(requestedBy)).toBeInTheDocument()
    expect(screen.getAllByTestId('eth-hash-info').some((el) => el.textContent === requestedBy)).toBe(false)
  })
})
