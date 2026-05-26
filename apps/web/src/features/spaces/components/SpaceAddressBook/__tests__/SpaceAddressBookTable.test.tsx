import { render, screen } from '@testing-library/react'
import SpaceAddressBookTable from '../SpaceAddressBookTable'
import type { AddressBookEntry } from '../SpaceAddressBookTable'
import { Builder } from '@/tests/Builder'
import { faker } from '@faker-js/faker'

jest.mock('@/hooks/useChains', () => () => ({ configs: [] }))
jest.mock('@/components/common/EthHashInfo', () => {
  const EthHashInfo = () => <span data-testid="eth-hash-info" />
  return EthHashInfo
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
})
