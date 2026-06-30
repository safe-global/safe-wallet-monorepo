import { render, screen } from '@testing-library/react'
import SpaceAddressBookTable from '../SpaceAddressBookTable'
import type { AddressBookEntry } from '../SpaceAddressBookTable'
import { Builder } from '@/tests/Builder'
import { faker } from '@faker-js/faker'

jest.mock('@/hooks/useChains', () => () => ({ configs: [] }))
jest.mock('@/features/address-poisoning', () => ({
  useListSimilarityWarnings: () => () => undefined,
}))
jest.mock('@/components/common/EthHashInfo', () => {
  const EthHashInfo = ({ address }: { address: string }) => <span data-testid="eth-hash-info">{address}</span>
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
})
