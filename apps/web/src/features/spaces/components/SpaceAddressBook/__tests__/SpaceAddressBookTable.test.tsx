import { render, screen } from '@testing-library/react'
import SpaceAddressBookTable from '../SpaceAddressBookTable'
import { Builder } from '@/tests/Builder'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
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
  Builder.new<SpaceAddressBookItemDto>().with({
    name: faker.person.fullName(),
    address: faker.finance.ethereumAddress(),
    chainIds: [faker.helpers.arrayElement(['1', '5', '100', '137'])],
    createdBy: faker.finance.ethereumAddress(),
    lastUpdatedBy: faker.finance.ethereumAddress(),
  })

describe('SpaceAddressBookTable', () => {
  it('renders actions when hasWallet is true', () => {
    render(<SpaceAddressBookTable entries={[entryBuilder().build()]} hasWallet={true} />)

    expect(screen.getByTestId('actions')).toBeInTheDocument()
  })

  it('does not render actions when hasWallet is false', () => {
    render(<SpaceAddressBookTable entries={[entryBuilder().build()]} hasWallet={false} />)

    expect(screen.queryByTestId('actions')).not.toBeInTheDocument()
  })
})
