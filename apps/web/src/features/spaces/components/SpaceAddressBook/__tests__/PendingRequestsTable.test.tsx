import { render, screen } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import PendingRequestsTable from '../PendingRequestsTable'
import type { AddressBookRequestItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { Builder } from '@/tests/Builder'

jest.mock('@/hooks/useChains', () => () => ({ configs: [] }))
jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => '1',
  useIsAdmin: () => true,
  useGetSpaceAddressBook: () => [],
}))
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useAddressBookRequestsApproveRequestV1Mutation: () => [jest.fn()],
  useAddressBookRequestsRejectRequestV1Mutation: () => [jest.fn()],
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
jest.mock('@/components/common/Identicon', () => {
  const Identicon = ({ address }: { address: string }) => <span data-testid="identicon" data-address={address} />
  return Identicon
})
jest.mock('@/features/multichain', () => ({
  NetworkLogosList: ({ networks }: { networks: { chainId: string }[] }) => (
    <span data-testid="network-logos" data-count={networks.length} />
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
