import { faker } from '@faker-js/faker'
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

const totals = () => within(screen.getByTestId('space-assets-totals'))

const renderGroupedBy = async (label: string) => {
  const rendered = renderWithUserEvent(<SpaceAssets />)
  await rendered.user.click(screen.getByRole('button', { name: /^Group by/ }))
  await rendered.user.click(await screen.findByRole('menuitemradio', { name: new RegExp(`^${label}`) }))
  return rendered
}

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

  describe('grouped by asset', () => {
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

    it('shows one collapsed band per asset with its amount and value summed across Safes and networks', async () => {
      await renderGroupedBy('Asset')

      const bands = screen.getAllByTestId('space-assets-group')
      expect(bands).toHaveLength(2)
      expect(within(bands[0]).getByText('ETH')).toBeInTheDocument()
      expect(within(bands[0]).getByText('3 ETH')).toBeInTheDocument()
      expect(within(bands[0]).getByText('$ 6,000')).toBeInTheDocument()
      expect(screen.queryAllByTestId('space-assets-row')).toHaveLength(0)
    })

    it('lists one row per network when an asset is expanded, summed across its Safes', async () => {
      const { user } = await renderGroupedBy('Asset')

      await user.click(screen.getByRole('button', { name: 'Expand ETH' }))

      const rows = screen.getAllByTestId('space-assets-row')
      expect(rows).toHaveLength(2)
      expect(within(rows[0]).getByText('Ethereum')).toBeInTheDocument()
      expect(within(rows[0]).getByText('2 Safe accounts')).toBeInTheDocument()
      expect(within(rows[0]).getByText('$ 4,000')).toBeInTheDocument()
    })

    it('expands and collapses every asset at once', async () => {
      const { user } = await renderGroupedBy('Asset')

      await user.click(screen.getByRole('button', { name: 'Expand all' }))
      const expandedRows = screen.getAllByTestId('space-assets-row').length
      await user.click(screen.getByRole('button', { name: 'Collapse all' }))

      expect(expandedRows).toBe(3)
      expect(screen.queryAllByTestId('space-assets-row')).toHaveLength(0)
    })

    it('sums every holding in the totals', async () => {
      await renderGroupedBy('Asset')

      expect(totals().getAllByText('$ 6,001')).toHaveLength(2)
    })

    it('narrows the assets and the totals to the search', async () => {
      const { user } = await renderGroupedBy('Asset')

      await user.type(screen.getByRole('searchbox', { name: 'Search assets' }), 'usdc')

      expect(await totals().findAllByText('$ 1')).toHaveLength(2)
      expect(screen.getAllByTestId('space-assets-group')).toHaveLength(1)
    })

    it('offers to clear a search that matches nothing', async () => {
      const { user } = await renderGroupedBy('Asset')

      await user.type(screen.getByRole('searchbox', { name: 'Search assets' }), 'dai')
      await user.click(await screen.findByRole('button', { name: 'Clear search and filters' }))

      expect(screen.getAllByTestId('space-assets-group')).toHaveLength(2)
    })
  })

  it('groups by type by default: tokens, then positions, each expanded', () => {
    givenSpaceSafes({ address: treasury, chainId: '1' }, { address: ops, chainId: '1' })
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
      [`1:${ops}`]: loaded(token('ETH', '5')),
    })

    render(<SpaceAssets />)

    const bands = screen.getAllByTestId('space-assets-group')
    expect(bands.map((band) => within(band).getByRole('button').getAttribute('aria-label'))).toEqual([
      'Collapse Tokens',
      'Collapse Positions',
    ])
    expect(within(bands[0]).getByText('$ 15')).toBeInTheDocument()
    expect(screen.getAllByTestId('space-assets-row')).toHaveLength(2)
  })

  it('groups by Safe when picked in Group by', async () => {
    givenSpaceSafes({ address: treasury, chainId: '1' }, { address: ops, chainId: '1' })
    givenAssets({ [`1:${treasury}`]: loaded(token('ETH', '10')), [`1:${ops}`]: loaded(token('ETH', '5')) })

    await renderGroupedBy('Safe')

    expect(screen.getAllByTestId('space-assets-group')).toHaveLength(2)
    expect(screen.getAllByTestId('space-assets-row')).toHaveLength(2)
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
