import { faker } from '@faker-js/faker'
import type { SpaceAddressBookItemDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { getIdenticonSrc } from '@safe-global/views/components/common/Identicon'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { chainBuilder } from '@/tests/builders/chains'
import { fakerChecksummedAddress, render, screen } from '@/tests/test-utils'
import QueueRowSafeTag from './QueueRowSafeTag'

const mockSpaceAddressBook: { current: SpaceAddressBookItemDto[] } = { current: [] }
jest.mock('@/features/spaces/public/hooks/useGetSpaceAddressBook', () => ({
  __esModule: true,
  default: () => mockSpaceAddressBook.current,
}))

const mockChainConfigs: { current: Chain[] } = { current: [] }
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: mockChainConfigs.current, loading: false }),
  useChain: () => undefined,
  useCurrentChain: () => undefined,
  useHasFeature: () => false,
}))

const CHAIN_ID = '137'
const chainName = 'Polygon'
const chainLogoUri = `https://cdn.example.com/${faker.string.alphanumeric(8)}.png`

const spaceEntry = (address: string, name: string): SpaceAddressBookItemDto =>
  ({
    address,
    name,
    chainIds: [CHAIN_ID],
    tagIds: [],
    createdBy: '',
    createdByUserId: 0,
    lastUpdatedBy: '',
    lastUpdatedByUserId: 0,
    createdAt: '',
    updatedAt: '',
  }) as SpaceAddressBookItemDto

const renderTag = (safeAddress: string, localName?: string) =>
  render(<QueueRowSafeTag safeAddress={safeAddress} chainId={CHAIN_ID} />, {
    initialReduxState: localName ? { addressBook: { [CHAIN_ID]: { [safeAddress]: localName } } as never } : undefined,
  })

describe('QueueRowSafeTag', () => {
  beforeEach(() => {
    mockSpaceAddressBook.current = []
    mockChainConfigs.current = [
      chainBuilder().with({ chainId: CHAIN_ID, chainName, shortName: 'matic', chainLogoUri }).build() as Chain,
    ]
  })

  it('names the Safe with its workspace address-book name before its local one', () => {
    const safeAddress = fakerChecksummedAddress()
    mockSpaceAddressBook.current = [spaceEntry(safeAddress, 'Treasury')]

    renderTag(safeAddress, 'My local name')

    expect(screen.getByText('Treasury')).toBeInTheDocument()
    expect(screen.queryByText('My local name')).not.toBeInTheDocument()
  })

  it('names the Safe with its local address-book name when the workspace has none', () => {
    const safeAddress = fakerChecksummedAddress()

    renderTag(safeAddress, 'My local name')

    expect(screen.getByText('My local name')).toBeInTheDocument()
  })

  it('shows the short address of a Safe with no address-book name', () => {
    const safeAddress = fakerChecksummedAddress()

    renderTag(safeAddress)

    expect(screen.getByText(shortenAddress(safeAddress))).toBeInTheDocument()
  })

  it('shows the identicon of the Safe and the logo of its network', () => {
    const safeAddress = fakerChecksummedAddress()

    const { container } = renderTag(safeAddress)

    expect(container.querySelector('[style*="background-image"]')).toHaveStyle({
      backgroundImage: `url(${getIdenticonSrc(safeAddress)})`,
    })
    expect(screen.getByRole('img', { name: chainName })).toHaveAttribute('src', chainLogoUri)
  })
})
