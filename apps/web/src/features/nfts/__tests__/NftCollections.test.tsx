import { renderWithUserEvent, screen, within } from '@/tests/test-utils'
import type { ReactElement } from 'react'
import NftCollections from '../components/NftCollections'
import type { Collectible } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import { trackEvent } from '@/services/analytics'
import useCollectibles from '@/hooks/useCollectibles'
import * as useChains from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import { shortenAddress } from '@safe-global/utils/utils/formatters'

jest.mock('@/services/observability', () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
  captureError: jest.fn(),
}))

jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  ...(
    jest.requireActual('@safe-global/test/mocks/analytics') as { createAnalyticsMock: () => object }
  ).createAnalyticsMock(),
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
    jest.spyOn(useChains, 'useChain').mockReturnValue(chainBuilder().build())
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

    const firstCheckbox = screen.getByTestId('nft-checkbox-1')
    const secondCheckbox = screen.getByTestId('nft-checkbox-2')

    await user.click(firstCheckbox)
    await user.click(secondCheckbox)

    expect(await screen.findByRole('button', { name: 'Send 2 NFTs' })).toBeInTheDocument()

    await user.click(firstCheckbox)

    expect(await screen.findByRole('button', { name: 'Send 1 NFT' })).toBeInTheDocument()
  })

  it('selects every listed NFT with the header "Select all" checkbox', async () => {
    const nftItems = [
      getCollectible({ id: '1', tokenName: 'Cat #1' }),
      getCollectible({ id: '2', tokenName: 'Cat #2' }),
      getCollectible({ id: '3', tokenName: 'Cat #3' }),
    ]

    const { user } = renderComponent(nftItems)

    expect(await screen.findByTestId('nft-checkbox-1')).toBeInTheDocument()
    await user.click(screen.getByTitle('Select all'))

    expect(await screen.findByRole('button', { name: 'Send 3 NFTs' })).toBeInTheDocument()
    for (const index of [1, 2, 3]) {
      expect(screen.getByTestId(`nft-checkbox-${index}`)).toHaveAttribute('aria-checked', 'true')
    }
  })

  it('shows each collection address shortened with copy and explorer buttons', async () => {
    const nftItems = [
      getCollectible({ id: '1', address: '0x1111111111111111111111111111111111111111' }),
      getCollectible({ id: '2', address: '0x2222222222222222222222222222222222222222' }),
    ]

    renderComponent(nftItems)

    for (const [index, nft] of nftItems.entries()) {
      const row = within(await screen.findByTestId(`nfts-table-row-${index + 1}`))
      expect(row.getByText(shortenAddress(nft.address))).toBeInTheDocument()
      expect(row.getAllByLabelText('Copy to clipboard').length).toBeGreaterThan(0)
      expect(row.getByTestId('explorer-btn')).toHaveAttribute('href', expect.stringContaining('http'))
    }
  })
})
