import { faker } from '@faker-js/faker'
import { formatPercentage, shortenAddress } from '@safe-global/utils/utils/formatters'
import { balanceBuilder, erc20TokenBuilder } from '@/tests/builders/balances'
import { chainBuilder } from '@/tests/builders/chains'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import { render, renderWithUserEvent, screen, within } from '@/tests/test-utils'
import type { SafeAssets as SafeAssetsResult } from '../../hooks/useSafeAssets'
import SpaceAssets from './SpaceAssets'

jest.mock('../../public/hooks/useSpaceSafes', () => ({ useSpaceSafes: jest.fn() }))
jest.mock('../../hooks/useSafeAssets', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/hooks/useChains', () => ({ __esModule: true, default: jest.fn(), useChain: jest.fn() }))
jest.mock('@/hooks/useAllAddressBooks', () => ({ useSafeNameResolver: () => () => '' }))

const mockUseSpaceSafes = jest.requireMock('../../public/hooks/useSpaceSafes').useSpaceSafes as jest.Mock
const mockUseSafeAssets = jest.requireMock('../../hooks/useSafeAssets').default as jest.Mock
const mockUseChains = jest.requireMock('@/hooks/useChains').default as jest.Mock

const ETHEREUM = chainBuilder().with({ chainId: '1', chainName: 'Ethereum' }).build()
const GNOSIS = chainBuilder().with({ chainId: '100', chainName: 'Gnosis Chain' }).build()

const token = (symbol: string, fiatBalance: string) =>
  balanceBuilder()
    .with({
      balance: '1000000',
      fiatBalance,
      tokenInfo: erc20TokenBuilder()
        .with({ symbol, name: `${symbol} token`, decimals: 6 })
        .build(),
    })
    .build()

const loaded = (...items: ReturnType<typeof token>[]): SafeAssetsResult => ({
  balances: { items, fiatTotal: '0' },
  protocols: [],
  isDeployed: true,
  isUnsupported: false,
  isLoading: false,
  isFetching: false,
  refetch: jest.fn(),
})

const failed = (refetch = jest.fn()): SafeAssetsResult => ({
  isDeployed: true,
  isUnsupported: false,
  isLoading: false,
  isFetching: false,
  error: new Error('Unreachable'),
  refetch,
})

const givenSpaceSafes = (...safes: { address: string; chainId: string }[]) =>
  mockUseSpaceSafes.mockReturnValue({
    allSafes: safes.map((safe) => safeItemBuilder().with(safe).build()),
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  })

const givenAssets = (byChainAndAddress: Record<string, SafeAssetsResult>) =>
  mockUseSafeAssets.mockImplementation(
    ({ chainId, address }: { chainId: string; address: string }) => byChainAndAddress[`${chainId}:${address}`],
  )

const withChange = (balance: ReturnType<typeof token>, fiatBalance24hChange: string) => ({
  ...balance,
  fiatBalance24hChange,
})

const totals = () => within(screen.getByTestId('space-assets-totals'))

describe('SpaceAssets', () => {
  const treasury = faker.finance.ethereumAddress()
  const ops = faker.finance.ethereumAddress()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseChains.mockReturnValue({ configs: [ETHEREUM, GNOSIS], loading: false })
  })

  it('says the Space has no Safe accounts yet', () => {
    givenSpaceSafes()

    render(<SpaceAssets />)

    expect(screen.getByText('No Safe accounts yet')).toBeInTheDocument()
  })

  it('reloads the Space Safe accounts after they failed to load', async () => {
    const refetch = jest.fn()
    mockUseSpaceSafes.mockReturnValue({ allSafes: [], isLoading: false, isError: true, refetch })

    const { user } = renderWithUserEvent(<SpaceAssets />)
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(refetch).toHaveBeenCalled()
  })

  describe('with tokens on several Safes and networks', () => {
    beforeEach(() => {
      givenSpaceSafes(
        { address: treasury, chainId: '1' },
        { address: treasury, chainId: '100' },
        { address: ops, chainId: '1' },
      )
      givenAssets({
        [`1:${treasury}`]: loaded(token('ETH', '3000'), token('USDC', '1')),
        [`100:${treasury}`]: loaded(token('ETH', '2000')),
        [`1:${ops}`]: loaded(token('ETH', '1000')),
      })
    })

    it('shows each token once, summed across Safes and networks, with the networks holding it', () => {
      render(<SpaceAssets />)

      const rows = screen.getAllByTestId('space-assets-row')
      expect(rows).toHaveLength(2)
      expect(within(rows[0]).getByText('3 ETH')).toBeInTheDocument()
      expect(within(rows[0]).getByText('$ 6,000')).toBeInTheDocument()
      expect(within(rows[0]).getByText('2 networks')).toBeInTheDocument()
      expect(within(rows[1]).getByText('Ethereum')).toBeInTheDocument()
    })

    it('shows the value with its decimals and the 24h change under it, as on the Safe Assets page', () => {
      givenAssets({
        [`1:${treasury}`]: loaded(withChange(token('ETH', '3000.5'), '10'), token('USDC', '1')),
        [`100:${treasury}`]: loaded(token('ETH', '2000')),
        [`1:${ops}`]: loaded(withChange(token('ETH', '1000'), '-10')),
      })

      render(<SpaceAssets />)

      const [eth] = screen.getAllByTestId('space-assets-row')
      expect(within(eth).getByText('.50')).toBeInTheDocument()
      expect(within(eth).getByText(formatPercentage(0.05))).toBeInTheDocument()
    })

    it('lists the Safes holding a token, with their share, when the token is hovered', async () => {
      const { user } = renderWithUserEvent(<SpaceAssets />)

      await user.hover(screen.getByRole('button', { name: 'ETH token: held by 2 Safe accounts' }))

      expect(await screen.findByText('Held by 2 Safe accounts')).toBeInTheDocument()
      expect(screen.getAllByTestId('signer-row').map((row) => row.textContent?.replace(/\s/g, ' '))).toEqual([
        `${shortenAddress(treasury)} · 2 ETH · $ 5,000`,
        `${shortenAddress(ops)} · 1 ETH · $ 1,000`,
      ])
    })

    it('shows the totals above the search and filters, and no Group by', () => {
      render(<SpaceAssets />)

      const totalsCard = screen.getByTestId('space-assets-totals')
      const search = screen.getByRole('searchbox', { name: 'Search assets' })
      expect(totalsCard.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(screen.queryByRole('button', { name: /^Group by/ })).not.toBeInTheDocument()
    })

    it('sums every holding in the totals', () => {
      render(<SpaceAssets />)

      expect(totals().getAllByText('$ 6,001')).toHaveLength(2)
    })

    it('collapses and expands the tokens at once', async () => {
      const { user } = renderWithUserEvent(<SpaceAssets />)

      await user.click(screen.getByRole('button', { name: 'Collapse all' }))
      const collapsedRows = screen.queryAllByTestId('space-assets-row').length
      await user.click(screen.getByRole('button', { name: 'Expand all' }))

      expect(collapsedRows).toBe(0)
      expect(screen.getAllByTestId('space-assets-row')).toHaveLength(2)
    })

    it('narrows the assets and the totals to the search', async () => {
      const { user } = renderWithUserEvent(<SpaceAssets />)

      await user.type(screen.getByRole('searchbox', { name: 'Search assets' }), 'usdc')

      expect(await totals().findAllByText('$ 1')).toHaveLength(2)
      expect(screen.getAllByTestId('space-assets-row')).toHaveLength(1)
    })

    it('offers to clear a search that matches nothing', async () => {
      const { user } = renderWithUserEvent(<SpaceAssets />)

      await user.type(screen.getByRole('searchbox', { name: 'Search assets' }), 'dai')
      await user.click(await screen.findByRole('button', { name: 'Clear search and filters' }))

      expect(screen.getAllByTestId('space-assets-row')).toHaveLength(2)
    })
  })

  it('shows tokens, then positions, each in its own band', () => {
    givenSpaceSafes({ address: treasury, chainId: '1' })
    givenAssets({
      [`1:${treasury}`]: {
        ...loaded(token('ETH', '10')),
        protocols: [
          {
            protocol: 'staking',
            protocol_metadata: { name: 'Staking', icon: { url: null } },
            fiatTotal: '20',
            items: [
              {
                name: 'Staked',
                items: [
                  {
                    balance: '1000000',
                    fiatBalance: '20',
                    fiatConversion: '1',
                    fiatBalance24hChange: null,
                    position_type: 'staked',
                    tokenInfo: {
                      address: faker.finance.ethereumAddress(),
                      decimals: 6,
                      logoUri: '',
                      name: 'ETH token',
                      symbol: 'ETH',
                      type: 'ERC20',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    })

    render(<SpaceAssets />)

    const bands = screen.getAllByTestId('space-assets-group')
    expect(bands.map((band) => within(band).getByRole('button').getAttribute('aria-label'))).toEqual([
      'Collapse Tokens',
      'Collapse Positions',
    ])
    expect(screen.getByText('ETH · Staking · Staking')).toBeInTheDocument()
  })

  it('leaves a failed network out of the totals and reloads it from the alert', async () => {
    const refetch = jest.fn()
    givenSpaceSafes({ address: treasury, chainId: '1' }, { address: treasury, chainId: '100' })
    givenAssets({ [`1:${treasury}`]: loaded(token('ETH', '10')), [`100:${treasury}`]: failed(refetch) })

    const { user } = renderWithUserEvent(<SpaceAssets />)
    await user.click(screen.getByTestId('unavailable-safes-alert'))
    await user.click(screen.getByRole('button', { name: 'Reload' }))

    expect(totals().getAllByText('$ 10')).toHaveLength(2)
    expect(totals().getByText(/couldn.t be loaded/)).toBeInTheDocument()
    expect(refetch).toHaveBeenCalled()
  })

  it('marks the totals as partial when a network loaded its tokens but not its positions', () => {
    givenSpaceSafes({ address: treasury, chainId: '1' })
    givenAssets({ [`1:${treasury}`]: { ...loaded(token('ETH', '10')), positionsError: new Error('Unreachable') } })

    render(<SpaceAssets />)

    expect(totals().getByText(/couldn.t be loaded/)).toBeInTheDocument()
    expect(screen.getByTestId('unavailable-safes-alert')).toBeInTheDocument()
  })

  it('keeps the reload alert when a search matches nothing while a network failed', async () => {
    givenSpaceSafes({ address: treasury, chainId: '1' }, { address: treasury, chainId: '100' })
    givenAssets({ [`1:${treasury}`]: loaded(token('ETH', '10')), [`100:${treasury}`]: failed() })

    const { user } = renderWithUserEvent(<SpaceAssets />)
    await user.type(screen.getByRole('searchbox', { name: 'Search assets' }), 'dai')

    expect(await screen.findByText('No assets')).toBeInTheDocument()
    expect(screen.getByTestId('unavailable-safes-alert')).toBeInTheDocument()
  })

  it('lists a network missing from the chain configs in the alert', () => {
    givenSpaceSafes({ address: treasury, chainId: '1' }, { address: treasury, chainId: '100' })
    givenAssets({
      [`1:${treasury}`]: loaded(token('ETH', '10')),
      [`100:${treasury}`]: {
        isDeployed: true,
        isUnsupported: true,
        isLoading: false,
        isFetching: false,
        refetch: jest.fn(),
      },
    })

    render(<SpaceAssets />)

    expect(screen.getByTestId('unavailable-safes-alert')).toHaveTextContent('1 Safe account not loaded')
  })
})
