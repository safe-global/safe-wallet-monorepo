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
  NetworkLogosPill: ({ networks }: { networks: { chainId: string }[] }) => (
    <span data-testid="network-logos" data-count={networks.length} />
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

  it('tells the extra action whether the row is compact', () => {
    const renderExtraAction = jest.fn(() => null)

    const { unmount } = render(
      <SpaceAddressBookTable entries={[entryBuilder().build()]} renderExtraAction={renderExtraAction} />,
    )
    expect(renderExtraAction).toHaveBeenLastCalledWith(expect.anything(), { isCompact: false })
    unmount()

    mockUseIsMobile.mockReturnValue(true)
    render(<SpaceAddressBookTable entries={[entryBuilder().build()]} renderExtraAction={renderExtraAction} />)
    expect(renderExtraAction).toHaveBeenLastCalledWith(expect.anything(), { isCompact: true })
  })

  // The extra action is a text button, so its column cannot live on the default narrow share
  it('widens the actions column when an extra action is rendered', () => {
    const lastHeader = (container: HTMLElement) => {
      const headers = container.querySelectorAll('th')
      return headers[headers.length - 1]
    }

    const { container, unmount } = render(<SpaceAddressBookTable entries={[entryBuilder().build()]} />)
    expect(lastHeader(container).className).toContain('md:w-[15%]')
    expect(lastHeader(container).style.getPropertyValue('--col-min-w')).toBe('80px')
    unmount()

    const withExtra = render(
      <SpaceAddressBookTable
        entries={[entryBuilder().build()]}
        showAddedBy={false}
        renderExtraAction={() => <button>Add to workspace</button>}
      />,
    )
    expect(lastHeader(withExtra.container).className).toContain('md:w-[35%]')
    expect(lastHeader(withExtra.container).style.getPropertyValue('--col-min-w')).toBe('240px')
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

  it('renders the network logos pill with all chain logos', () => {
    const chainIds = ['1', '137', '10', '42161', '8453']
    render(<SpaceAddressBookTable entries={[entryBuilder().with({ chainIds }).build()]} />)

    // The 3-logo cap and +N indicator live inside NetworkLogosPill (see its own stories/tests).
    const logosList = screen.getByTestId('network-logos')
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

  it('exposes the full name via a tooltip trigger in the Name column', () => {
    const name = 'A very long contact name that would overflow the Name column'
    render(<SpaceAddressBookTable entries={[entryBuilder().with({ name }).build()]} />)

    expect(screen.getByRole('button', { name })).toBeInTheDocument()
  })

  it('truncates the name on desktop and wraps it on mobile, where the address column is gone', () => {
    const name = 'A very long contact name that would overflow the Name column'
    const entry = entryBuilder().with({ name, createdBy: faker.internet.email() }).build()

    const { unmount } = render(<SpaceAddressBookTable entries={[entry]} />)
    expect(screen.getByRole('button', { name })).toHaveClass('truncate')
    expect(screen.getByText('Address')).toBeInTheDocument()
    unmount()

    mockUseIsMobile.mockReturnValue(true)
    render(<SpaceAddressBookTable entries={[entry]} />)
    expect(screen.getByRole('button', { name })).not.toHaveClass('truncate')
    expect(screen.queryByText('Address')).not.toBeInTheDocument()
  })

  it('moves the address under the name on mobile', () => {
    mockUseIsMobile.mockReturnValue(true)
    const entry = entryBuilder().with({ createdBy: faker.internet.email() }).build()

    render(<SpaceAddressBookTable entries={[entry]} />)

    const nameCell = screen.getByRole('button', { name: entry.name }).closest('td')
    expect(nameCell).toContainElement(screen.getByTestId('eth-hash-info'))
    expect(screen.getByTestId('eth-hash-info')).toHaveAttribute('data-short-address', 'true')
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
