import { render, screen } from '@testing-library/react'
import SpaceAddressBookTable from '../SpaceAddressBookTable'
import type { AddressBookEntry } from '../SpaceAddressBookTable'
import { Builder } from '@/tests/Builder'
import { faker } from '@faker-js/faker'

jest.mock('@/hooks/useChains', () => () => ({ configs: [] }))
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
  NetworkLogosList: () => <span data-testid="network-logos" />,
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
  it('renders actions for non-local entries', () => {
    render(<SpaceAddressBookTable entries={[entryBuilder().build()]} />)

    expect(screen.getByTestId('actions')).toBeInTheDocument()
  })

  it('does not render actions for local entries', () => {
    render(<SpaceAddressBookTable entries={[entryBuilder().with({ isLocal: true }).build()]} />)

    expect(screen.queryByTestId('actions')).not.toBeInTheDocument()
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
