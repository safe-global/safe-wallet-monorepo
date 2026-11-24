import { faker } from '@faker-js/faker'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { chainBuilder } from '@/tests/builders/chains'
import { renderHook } from '@/tests/test-utils'
import { initialState as initialSettings, TOKEN_LISTS } from '@/store/settingsSlice'
import useSafeAssets from '../useSafeAssets'

jest.mock('@safe-global/utils/hooks/useTotalBalances')
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/positions', () => ({
  usePositionsGetPositionsV1Query: jest.fn(),
}))
jest.mock('@/hooks/useChains', () => ({ __esModule: true, default: jest.fn(), useChain: jest.fn() }))

const mockUseTotalBalances = jest.requireMock('@safe-global/utils/hooks/useTotalBalances').default as jest.Mock
const mockUsePositionsQuery = jest.requireMock('@safe-global/store/gateway/AUTO_GENERATED/positions')
  .usePositionsGetPositionsV1Query as jest.Mock
const mockUseChain = jest.requireMock('@/hooks/useChains').useChain as jest.Mock
const mockUseChains = jest.requireMock('@/hooks/useChains').default as jest.Mock

const CHAIN_ID = '1'

const chainWith = (...features: FEATURES[]) => chainBuilder().with({ chainId: CHAIN_ID, features }).build()

const protocol: Protocol = {
  protocol: 'Lending',
  protocol_metadata: { name: 'Lending', icon: { url: null } },
  fiatTotal: '10',
  items: [],
}

const renderUseSafeAssets = (
  address: string,
  { tokenList = TOKEN_LISTS.TRUSTED, undeployed = false }: { tokenList?: TOKEN_LISTS; undeployed?: boolean } = {},
) =>
  renderHook(() => useSafeAssets({ chainId: CHAIN_ID, address }), {
    initialReduxState: {
      settings: { ...initialSettings, tokenList },
      undeployedSafes: undeployed ? { [CHAIN_ID]: { [address]: {} } } : {},
    } as never,
  })

describe('useSafeAssets', () => {
  const address = faker.finance.ethereumAddress()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseTotalBalances.mockReturnValue({ data: undefined, loading: true, isFetching: true, refetch: jest.fn() })
    mockUsePositionsQuery.mockReturnValue({ currentData: undefined, isLoading: false, isFetching: false })
    mockUseChains.mockReturnValue({ configs: [], loading: false })
  })

  it('reads the trusted token list on a chain with the portfolio endpoint and a default token list', () => {
    mockUseChain.mockReturnValue(chainWith(FEATURES.PORTFOLIO_ENDPOINT, FEATURES.DEFAULT_TOKENLIST))

    renderUseSafeAssets(address)

    expect(mockUseTotalBalances).toHaveBeenCalledWith(
      expect.objectContaining({ safeAddress: address, chainId: CHAIN_ID, trusted: true, hasPortfolioFeature: true }),
    )
  })

  it('reads all tokens when the user chose all tokens', () => {
    mockUseChain.mockReturnValue(chainWith(FEATURES.PORTFOLIO_ENDPOINT, FEATURES.DEFAULT_TOKENLIST))

    renderUseSafeAssets(address, { tokenList: TOKEN_LISTS.ALL })

    expect(mockUseTotalBalances).toHaveBeenCalledWith(
      expect.objectContaining({ trusted: false, isAllTokensSelected: true }),
    )
  })

  it('waits for the chain config before reading balances', () => {
    mockUseChain.mockReturnValue(undefined)
    mockUseChains.mockReturnValue({ configs: [], loading: true })

    renderUseSafeAssets(address)

    expect(mockUseTotalBalances).toHaveBeenCalledWith(expect.objectContaining({ trusted: undefined }))
  })

  it('reads nothing on a chain missing from the loaded chain configs', () => {
    mockUseChain.mockReturnValue(undefined)

    const { result } = renderUseSafeAssets(address)

    expect(mockUseTotalBalances).toHaveBeenCalledWith(expect.objectContaining({ skip: true }))
    expect(result.current).toEqual(expect.objectContaining({ isUnsupported: true, isLoading: false }))
  })

  it('keeps a positions failure apart from the tokens', () => {
    mockUseChain.mockReturnValue(chainWith(FEATURES.POSITIONS))
    mockUseTotalBalances.mockReturnValue({
      data: { items: [], fiatTotal: '5' },
      loading: false,
      isFetching: false,
      refetch: jest.fn(),
    })
    mockUsePositionsQuery.mockReturnValue({ isLoading: false, isFetching: false, error: { status: 500 } })

    const { result } = renderUseSafeAssets(address)

    expect(result.current).toEqual(expect.objectContaining({ error: undefined, positionsError: { status: 500 } }))
  })

  it('reads nothing for a Safe that is not deployed on the chain', () => {
    mockUseChain.mockReturnValue(chainWith(FEATURES.PORTFOLIO_ENDPOINT, FEATURES.POSITIONS))

    const { result } = renderUseSafeAssets(address, { undeployed: true })

    expect(mockUseTotalBalances).toHaveBeenCalledWith(expect.objectContaining({ skip: true, isDeployed: false }))
    expect(result.current).toEqual(expect.objectContaining({ isDeployed: false, isLoading: false }))
  })

  it('takes the positions from the portfolio on a chain with the portfolio endpoint', () => {
    mockUseChain.mockReturnValue(chainWith(FEATURES.PORTFOLIO_ENDPOINT, FEATURES.POSITIONS))
    mockUseTotalBalances.mockReturnValue({
      data: { items: [], fiatTotal: '0', positions: [] },
      loading: false,
      isFetching: false,
      refetch: jest.fn(),
    })

    const { result } = renderUseSafeAssets(address)

    expect(mockUsePositionsQuery).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }))
    expect(result.current.protocols).toEqual([])
  })

  it('reads the positions endpoint on a chain with positions but no portfolio endpoint', () => {
    mockUseChain.mockReturnValue(chainWith(FEATURES.POSITIONS))
    mockUsePositionsQuery.mockReturnValue({ currentData: [protocol], isLoading: false, isFetching: false })

    const { result } = renderUseSafeAssets(address)

    expect(mockUsePositionsQuery).toHaveBeenCalledWith(
      { chainId: CHAIN_ID, safeAddress: address, fiatCode: initialSettings.currency },
      expect.objectContaining({ skip: false }),
    )
    expect(result.current.protocols).toEqual([protocol])
  })

  it('has no positions on a chain without the positions feature', () => {
    mockUseChain.mockReturnValue(chainWith())

    const { result } = renderUseSafeAssets(address)

    expect(result.current.protocols).toBeUndefined()
  })
})
