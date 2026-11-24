import { faker } from '@faker-js/faker'
import { balanceBuilder } from '@/tests/builders/balances'
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

const MAINNET = chainBuilder().with({ chainId: '1', chainName: 'Ethereum' }).build()
const GNOSIS = chainBuilder().with({ chainId: '100', chainName: 'Gnosis Chain' }).build()

const loaded = (tokensFiatTotal: string): SafeAssetsResult => ({
  balances: { items: [balanceBuilder().build()], fiatTotal: tokensFiatTotal, tokensFiatTotal },
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

describe('SpaceAssets', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseChains.mockReturnValue({ configs: [MAINNET, GNOSIS] })
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

  it('sums the tokens of every Safe and network in the totals', () => {
    const first = faker.finance.ethereumAddress()
    const second = faker.finance.ethereumAddress()
    givenSpaceSafes(
      { address: first, chainId: '1' },
      { address: first, chainId: '100' },
      { address: second, chainId: '1' },
    )
    givenAssets({ [`1:${first}`]: loaded('10'), [`100:${first}`]: loaded('20'), [`1:${second}`]: loaded('5') })

    render(<SpaceAssets />)

    const totals = screen.getByTestId('space-assets-totals')
    expect(within(totals).getAllByText('$ 35')).toHaveLength(2)
    expect(screen.getAllByTestId('space-assets-safe')).toHaveLength(2)
    expect(screen.getAllByTestId('space-assets-chain')).toHaveLength(3)
  })

  it('leaves a failed network out of the totals and reloads it from the alert', async () => {
    const address = faker.finance.ethereumAddress()
    const refetch = jest.fn()
    givenSpaceSafes({ address, chainId: '1' }, { address, chainId: '100' })
    givenAssets({ [`1:${address}`]: loaded('10'), [`100:${address}`]: failed(refetch) })

    const { user } = renderWithUserEvent(<SpaceAssets />)
    await user.click(screen.getByTestId('unavailable-safes-alert'))
    await user.click(screen.getByRole('button', { name: 'Reload' }))

    const totals = screen.getByTestId('space-assets-totals')
    expect(within(totals).getAllByText('$ 10')).toHaveLength(2)
    expect(within(totals).getByText(/couldn.t be loaded/)).toBeInTheDocument()
    expect(refetch).toHaveBeenCalled()
  })

  it('says a Safe is not activated on a network where it is not deployed', () => {
    const address = faker.finance.ethereumAddress()
    givenSpaceSafes({ address, chainId: '1' })
    givenAssets({
      [`1:${address}`]: {
        isDeployed: false,
        isUnsupported: false,
        isLoading: false,
        isFetching: false,
        refetch: jest.fn(),
      },
    })

    render(<SpaceAssets />)

    expect(screen.getByText(/isn.t activated on this network yet/)).toBeInTheDocument()
  })

  it('marks the totals as partial when a network loaded its tokens but not its positions', () => {
    const address = faker.finance.ethereumAddress()
    givenSpaceSafes({ address, chainId: '1' })
    givenAssets({
      [`1:${address}`]: { ...loaded('10'), protocols: undefined, positionsError: new Error('Unreachable') },
    })

    render(<SpaceAssets />)

    expect(screen.getByText(/couldn.t load the positions on this network/i)).toBeInTheDocument()
    expect(within(screen.getByTestId('space-assets-totals')).getByText(/couldn.t be loaded/)).toBeInTheDocument()
  })

  it('shows no total for a Safe whose networks all failed', () => {
    const address = faker.finance.ethereumAddress()
    givenSpaceSafes({ address, chainId: '1' })
    givenAssets({ [`1:${address}`]: failed() })

    render(<SpaceAssets />)

    expect(within(screen.getByTestId('space-assets-safe')).getByText('—')).toBeInTheDocument()
  })

  it('says the assets of a network missing from the chain configs cannot be shown', () => {
    const address = faker.finance.ethereumAddress()
    givenSpaceSafes({ address, chainId: '1' })
    givenAssets({
      [`1:${address}`]: {
        isDeployed: true,
        isUnsupported: true,
        isLoading: false,
        isFetching: false,
        refetch: jest.fn(),
      },
    })

    render(<SpaceAssets />)

    expect(screen.getByText(/assets on this network can.t be shown/i)).toBeInTheDocument()
  })
})
