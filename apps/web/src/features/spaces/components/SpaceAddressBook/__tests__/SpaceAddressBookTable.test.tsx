import { render, screen, fireEvent } from '@testing-library/react'
import SpaceAddressBookTable from '../SpaceAddressBookTable'
import type { AddressBookEntry } from '../SpaceAddressBookTable'
import { Builder } from '@/tests/Builder'
import { faker } from '@faker-js/faker'

const mockUseIsMobile = jest.fn(() => false)
jest.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => mockUseIsMobile() }))

jest.mock('@/hooks/useChains', () => () => ({ configs: [] }))
jest.mock('@/components/common/EthHashInfo', () => {
  const EthHashInfo = ({ address, shortAddress }: { address: string; shortAddress?: boolean }) => (
    <span data-testid="eth-hash-info" data-short-address={String(Boolean(shortAddress))}>
      {address}
    </span>
  )
  return EthHashInfo
})
jest.mock('@/components/common/EmailInfo', () => {
  const EmailInfo = ({ email }: { email: string }) => <span data-testid="email-info">{email}</span>
  return EmailInfo
})
jest.mock('@/components/common/Identicon', () => {
  const Identicon = () => <span data-testid="identicon" />
  return Identicon
})
jest.mock('@/features/multichain', () => ({
  NetworkLogosTooltip: ({ networks, maxVisible }: { networks: { chainId: string }[]; maxVisible?: number }) => (
    <span data-testid="network-logos" data-max-visible={maxVisible} data-count={networks.length} />
  ),
}))
jest.mock('@/components/common/ChainIndicator', () => {
  const ChainIndicator = () => <span data-testid="chain-indicator" />
  return ChainIndicator
})
jest.mock('../SpaceAddressBookActions', () => {
  const SpaceAddressBookActions = () => <div data-testid="actions" />
  return SpaceAddressBookActions
})
jest.mock('../LocalContactActions', () => {
  const LocalContactActions = () => <div data-testid="local-actions" />
  return LocalContactActions
})

const mockResolveMemberName = jest.fn()
jest.mock('../../../hooks/useMemberNameResolver', () => ({
  useMemberNameResolver: () => mockResolveMemberName,
}))

const entryBuilder = () =>
  Builder.new<AddressBookEntry>().with({
    name: faker.person.fullName(),
    address: faker.finance.ethereumAddress(),
    chainIds: [faker.helpers.arrayElement(['1', '5', '100', '137'])],
    createdBy: faker.finance.ethereumAddress(),
    lastUpdatedBy: faker.finance.ethereumAddress(),
    isLocal: false,
  })

describe('SpaceAddressBookTable', () => {
  beforeEach(() => {
    mockUseIsMobile.mockReturnValue(false)
    mockResolveMemberName.mockReset()
    mockResolveMemberName.mockReturnValue(undefined)
  })

  it('resolves the "Added by" cell to the space member name by user id', () => {
    const memberName = 'My space creator'
    mockResolveMemberName.mockImplementation((userId: number | undefined) => (userId === 7 ? memberName : undefined))

    render(
      <SpaceAddressBookTable
        entries={[entryBuilder().with({ createdBy: faker.finance.ethereumAddress(), createdByUserId: 7 }).build()]}
      />,
    )

    expect(screen.getByText(memberName)).toBeInTheDocument()
    // Only the Address column renders EthHashInfo; the attribution shows the member name
    expect(screen.getAllByTestId('eth-hash-info')).toHaveLength(1)
  })

  it('renders actions for non-local entries', () => {
    render(<SpaceAddressBookTable entries={[entryBuilder().build()]} />)

    expect(screen.getByTestId('actions')).toBeInTheDocument()
  })

  it('renders local actions instead of space actions for local entries', () => {
    render(<SpaceAddressBookTable entries={[entryBuilder().with({ isLocal: true }).build()]} />)

    expect(screen.queryByTestId('actions')).not.toBeInTheDocument()
    expect(screen.getByTestId('local-actions')).toBeInTheDocument()
  })

  it('renders the network logos tooltip with maxVisible=3 for chain logos', () => {
    const chainIds = ['1', '137', '10', '42161', '8453']
    render(<SpaceAddressBookTable entries={[entryBuilder().with({ chainIds }).build()]} />)

    const logosList = screen.getByTestId('network-logos')
    expect(logosList).toHaveAttribute('data-max-visible', '3')
    expect(logosList).toHaveAttribute('data-count', '5')
  })

  it('renders the network logos tooltip even when entry covers all chains', () => {
    render(
      <SpaceAddressBookTable
        entries={[
          entryBuilder()
            .with({ chainIds: ['1', '137', '10'] })
            .build(),
        ]}
      />,
    )

    expect(screen.getByTestId('network-logos')).toBeInTheDocument()
    expect(screen.queryByText('All')).not.toBeInTheDocument()
  })

  it('renders EthHashInfo in the "Added by" cell when createdBy is an address', () => {
    const createdBy = faker.finance.ethereumAddress()
    render(<SpaceAddressBookTable entries={[entryBuilder().with({ createdBy }).build()]} />)

    // One EthHashInfo for the Address column, one for the "Added by" cell
    expect(screen.getAllByTestId('eth-hash-info')).toHaveLength(2)
    expect(screen.queryByTestId('email-info')).not.toBeInTheDocument()
  })

  it('renders EmailInfo in the "Added by" cell when createdBy is an email', () => {
    const createdBy = faker.internet.email()
    render(<SpaceAddressBookTable entries={[entryBuilder().with({ createdBy }).build()]} />)

    // EthHashInfo only renders for the Address column; "Added by" uses EmailInfo
    expect(screen.getAllByTestId('eth-hash-info')).toHaveLength(1)
    expect(screen.getByTestId('email-info')).toHaveTextContent(createdBy)
  })

  it('omits the middle column on the "My contacts" layout (showAddedBy=false)', () => {
    const createdBy = faker.finance.ethereumAddress()
    render(<SpaceAddressBookTable entries={[entryBuilder().with({ createdBy }).build()]} showAddedBy={false} />)

    expect(screen.queryByText('Added by')).not.toBeInTheDocument()
    expect(screen.queryByText('Last updated')).not.toBeInTheDocument()
    // Only the Address column renders EthHashInfo — there is no "Added by" cell
    expect(screen.getAllByTestId('eth-hash-info')).toHaveLength(1)
  })

  it('dims duplicate entries', () => {
    const entry = entryBuilder().with({ isDuplicate: true }).build()
    render(<SpaceAddressBookTable entries={[entry]} />)

    const nameTrigger = screen.getByRole('button', { name: entry.name })
    expect(nameTrigger.closest('tr')).toHaveClass('opacity-50')
    expect(nameTrigger.closest('div')).not.toHaveClass('line-through')
  })

  it('exposes the full name via a tooltip trigger in the Name column', () => {
    const name = 'A very long contact name that would overflow the Name column'
    render(<SpaceAddressBookTable entries={[entryBuilder().with({ name }).build()]} />)

    expect(screen.getByRole('button', { name })).toBeInTheDocument()
  })

  it('shortens the address on mobile and shows it in full on desktop', () => {
    // createdBy as an email keeps EthHashInfo unique to the Address column
    const createdBy = faker.internet.email()

    const { unmount } = render(<SpaceAddressBookTable entries={[entryBuilder().with({ createdBy }).build()]} />)
    expect(screen.getByTestId('eth-hash-info')).toHaveAttribute('data-short-address', 'false')
    unmount()

    mockUseIsMobile.mockReturnValue(true)
    render(<SpaceAddressBookTable entries={[entryBuilder().with({ createdBy }).build()]} />)
    expect(screen.getByTestId('eth-hash-info')).toHaveAttribute('data-short-address', 'true')
  })

  it('reveals the hidden chains and "Added by" in the detail row when expanded on mobile', () => {
    mockUseIsMobile.mockReturnValue(true)
    const createdBy = faker.internet.email()
    render(
      <SpaceAddressBookTable
        entries={[
          entryBuilder()
            .with({ chainIds: ['1', '137'], createdBy })
            .build(),
        ]}
      />,
    )

    const chainsBefore = screen.queryAllByTestId('chain-indicator').length

    fireEvent.click(screen.getByRole('button', { name: 'Show details' }))

    // The detail row renders one ChainIndicator per chain plus the "Added by" value
    expect(screen.queryAllByTestId('chain-indicator').length).toBeGreaterThan(chainsBefore)
    expect(screen.getByRole('button', { name: 'Hide details' })).toBeInTheDocument()
    expect(screen.getAllByTestId('email-info').length).toBeGreaterThan(0)
  })
})
