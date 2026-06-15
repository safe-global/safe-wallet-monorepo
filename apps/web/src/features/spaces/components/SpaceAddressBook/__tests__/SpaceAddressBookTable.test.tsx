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
  NetworkLogosList: ({
    networks,
    showHasMore,
    maxVisible,
  }: {
    networks: { chainId: string }[]
    showHasMore?: boolean
    maxVisible?: number
  }) => (
    <span
      data-testid="network-logos"
      data-show-has-more={showHasMore}
      data-max-visible={maxVisible}
      data-count={networks.length}
    />
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
  })

  it('renders actions for non-local entries', () => {
    render(<SpaceAddressBookTable entries={[entryBuilder().build()]} />)

    expect(screen.getByTestId('actions')).toBeInTheDocument()
  })

  it('does not render actions for local entries', () => {
    render(<SpaceAddressBookTable entries={[entryBuilder().with({ isLocal: true }).build()]} />)

    expect(screen.queryByTestId('actions')).not.toBeInTheDocument()
  })

  it('renders NetworkLogosList with showHasMore and maxVisible=3 for chain logos', () => {
    const chainIds = ['1', '137', '10', '42161', '8453']
    render(<SpaceAddressBookTable entries={[entryBuilder().with({ chainIds }).build()]} />)

    const logosList = screen.getByTestId('network-logos')
    expect(logosList).toHaveAttribute('data-show-has-more', 'true')
    expect(logosList).toHaveAttribute('data-max-visible', '3')
    expect(logosList).toHaveAttribute('data-count', '5')
  })

  it('renders NetworkLogosList even when entry covers all chains', () => {
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

    const nameSpan = screen.getByText(entry.name)
    expect(nameSpan.closest('tr')).toHaveClass('opacity-50')
    expect(nameSpan.parentElement).toHaveClass('line-through')
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
