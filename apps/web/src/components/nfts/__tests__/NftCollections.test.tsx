import { renderWithUserEvent, screen, within } from '@/tests/test-utils'
import type { ReactElement } from 'react'
import NftCollections from '../NftCollections'
import type { Collectible } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import { trackEvent } from '@/services/analytics'
import useCollectibles from '@/hooks/useCollectibles'

jest.mock('@/services/observability', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
  captureException: jest.fn(),
}))

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (ok: boolean) => ReactElement }) => children(true),
}))

jest.mock('@/components/common/InfiniteScroll', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/hooks/useCollectibles')

const mockTrackEvent = trackEvent as jest.MockedFunction<typeof trackEvent>
const mockUseCollectibles = useCollectibles as jest.MockedFunction<typeof useCollectibles>

const getCollectible = (overrides: Partial<Collectible> = {}): Collectible => ({
  address: '0x0000000000000000000000000000000000000001',
  tokenName: 'NFT',
  tokenSymbol: 'NFT',
  logoUri: '',
  id: '1',
  metadata: null,
  description: null,
  imageUri: null,
  uri: null,
  ...overrides,
})

describe('NftCollections', () => {
  beforeEach(() => {
    mockTrackEvent.mockClear()
  })

  const renderComponent = (nfts: Collectible[]) => {
    mockUseCollectibles.mockReturnValue({
      nfts,
      error: undefined,
      isInitialLoading: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      loadMore: jest.fn(),
    })

    return renderWithUserEvent(<NftCollections />)
  }

  it('updates the selected NFT count when toggling checkboxes', async () => {
    const nftItems = [
      getCollectible({ id: '1', tokenName: 'Cat #1' }),
      getCollectible({ id: '2', tokenName: 'Cat #2' }),
      getCollectible({ id: '3', tokenName: 'Cat #3' }),
    ]

    const { user } = renderComponent(nftItems)

    expect(await screen.findByTestId('nft-checkbox-1')).toBeInTheDocument()

    const firstCheckbox = within(screen.getByTestId('nft-checkbox-1')).getByRole('checkbox')
    const secondCheckbox = within(screen.getByTestId('nft-checkbox-2')).getByRole('checkbox')

    await user.click(firstCheckbox)
    await user.click(secondCheckbox)

    expect(await screen.findByRole('button', { name: 'Send 2 NFTs' })).toBeInTheDocument()

    await user.click(firstCheckbox)

    expect(await screen.findByRole('button', { name: 'Send 1 NFT' })).toBeInTheDocument()
  })
})
