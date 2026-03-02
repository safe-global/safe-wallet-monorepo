import { renderHook } from '@testing-library/react'
import useTotalBalances, { type UseTotalBalancesParams } from '@safe-global/utils/hooks/useTotalBalances'
import * as balancesQueries from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import * as portfolioQueries from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { Portfolio } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'

type MockQueryResult = {
  currentData: unknown
  isLoading: boolean
  isFetching: boolean
  error: unknown
  refetch: jest.Mock
}

const SAFE_ADDRESS = '0x0000000000000000000000000000000000001234'
const CHAIN_ID = '5'

const mockRefetch = jest.fn()

const createMockTxServiceBalances = (): Balances => ({
  fiatTotal: '1000',
  items: [
    {
      balance: '1000000000000000000',
      fiatBalance: '1000',
      fiatConversion: '1000',
      tokenInfo: {
        address: '0x0000000000000000000000000000000000000001',
        decimals: 18,
        logoUri: '',
        name: 'Test Token',
        symbol: 'TEST',
        type: 'ERC20',
      },
    },
  ],
})

const createMockPortfolio = (): Portfolio => ({
  totalBalanceFiat: '2000',
  totalTokenBalanceFiat: '1500',
  totalPositionsBalanceFiat: '500',
  tokenBalances: [
    {
      tokenInfo: {
        address: '0x0000000000000000000000000000000000000002',
        decimals: 18,
        logoUri: 'https://example.com/logo.png',
        name: 'Portfolio Token',
        symbol: 'PT',
        type: 'ERC20' as const,
        chainId: CHAIN_ID,
        trusted: true,
      },
      balance: '2000000000000000000',
      balanceFiat: '1500',
      price: '750',
      priceChangePercentage1d: '0.05',
    },
  ],
  positionBalances: [],
})

const createMockEmptyPortfolio = (): Portfolio => ({
  totalBalanceFiat: '0',
  totalTokenBalanceFiat: '0',
  totalPositionsBalanceFiat: '0',
  tokenBalances: [],
  positionBalances: [],
})

const defaultParams: UseTotalBalancesParams = {
  safeAddress: SAFE_ADDRESS,
  chainId: CHAIN_ID,
  currency: 'usd',
  trusted: false,
  hasPortfolioFeature: false,
  isAllTokensSelected: true,
  isDeployed: true,
}

const mockQueryResult = (overrides: Partial<MockQueryResult> = {}): MockQueryResult => ({
  currentData: undefined,
  isLoading: false,
  isFetching: false,
  error: undefined,
  refetch: mockRefetch,
  ...overrides,
})

describe('useTotalBalances', () => {
  const setupAndRender = (
    params: Partial<UseTotalBalancesParams>,
    mocks: { txService?: Partial<MockQueryResult>; portfolio?: Partial<MockQueryResult> } = {},
  ) => {
    if (mocks.txService) {
      jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockReturnValue(mockQueryResult(mocks.txService))
    }
    if (mocks.portfolio) {
      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue(mockQueryResult(mocks.portfolio))
    }
    return renderHook(() => useTotalBalances({ ...defaultParams, ...params }))
  }

  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockReturnValue(mockQueryResult())
    jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue(mockQueryResult())
  })

  describe('no portfolio feature', () => {
    it('should return tx service balances', () => {
      const { result } = setupAndRender({}, { txService: { currentData: createMockTxServiceBalances() } })

      expect(result.current.data?.fiatTotal).toBe('1000')
      expect(result.current.data?.tokensFiatTotal).toBe('1000')
      expect(result.current.data?.positionsFiatTotal).toBe('0')
      expect(result.current.data?.positions).toBeUndefined()
      expect(result.current.error).toBeUndefined()
      expect(result.current.loading).toBe(false)
    })

    it('should return counterfactual balances for undeployed safe', () => {
      const mockCfBalances: Balances = { fiatTotal: '0', items: [] }

      const { result } = renderHook(() =>
        useTotalBalances({
          ...defaultParams,
          isDeployed: false,
          counterfactualResult: [mockCfBalances, undefined, false],
        }),
      )

      expect(result.current.data?.fiatTotal).toBe('0')
      expect(result.current.error).toBeUndefined()
      expect(result.current.loading).toBe(false)
    })

    it('should handle tx service errors', () => {
      const mockError = new Error('TX service error')

      jest
        .spyOn(balancesQueries, 'useBalancesGetBalancesV1Query')
        .mockReturnValue(mockQueryResult({ error: mockError }))

      const { result } = renderHook(() => useTotalBalances(defaultParams))

      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.loading).toBe(true)
    })

    it('should show loading when no data and no error', () => {
      const { result } = renderHook(() => useTotalBalances(defaultParams))

      expect(result.current.data).toBeUndefined()
      expect(result.current.loading).toBe(true)
    })
  })

  describe('portfolio feature enabled', () => {
    const portfolioParams: UseTotalBalancesParams = {
      ...defaultParams,
      hasPortfolioFeature: true,
      isAllTokensSelected: false,
    }

    it('should return portfolio balances in default tokens mode', () => {
      const { result } = setupAndRender(portfolioParams, { portfolio: { currentData: createMockPortfolio() } })

      expect(result.current.data?.fiatTotal).toBe('2000')
      expect(result.current.data?.tokensFiatTotal).toBe('1500')
      expect(result.current.data?.positionsFiatTotal).toBe('500')
      expect(result.current.data?.positions).toEqual([])
      expect(result.current.data?.items).toHaveLength(1)
      expect(result.current.error).toBeUndefined()
      expect(result.current.loading).toBe(false)
    })

    it('should transform portfolio token data correctly', () => {
      const mockPortfolio = createMockPortfolio()

      jest
        .spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query')
        .mockReturnValue(mockQueryResult({ currentData: mockPortfolio }))

      const { result } = renderHook(() => useTotalBalances(portfolioParams))

      const item = result.current.data?.items[0]
      expect(item?.tokenInfo.logoUri).toBe('https://example.com/logo.png')
      expect(item?.fiatBalance).toBe('1500')
      expect(item?.fiatConversion).toBe('750')
      expect(item?.fiatBalance24hChange).toBe('0.05')
    })

    it('should fallback to tx service when portfolio returns empty', () => {
      const { result } = setupAndRender(portfolioParams, {
        portfolio: { currentData: createMockEmptyPortfolio() },
        txService: { currentData: createMockTxServiceBalances() },
      })

      expect(result.current.data?.fiatTotal).toBe('1000')
      expect(result.current.data?.tokensFiatTotal).toBe('1000')
    })

    it('should fallback to tx service when portfolio errors', () => {
      const { result } = setupAndRender(portfolioParams, {
        portfolio: { error: new Error('Portfolio error') },
        txService: { currentData: createMockTxServiceBalances() },
      })

      expect(result.current.data?.fiatTotal).toBe('1000')
    })

    it('should use counterfactual balances on fallback for undeployed safe', () => {
      const mockEmptyPortfolio = createMockEmptyPortfolio()
      const mockCfBalances: Balances = { fiatTotal: '500', items: [] }

      jest
        .spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query')
        .mockReturnValue(mockQueryResult({ currentData: mockEmptyPortfolio }))

      const { result } = renderHook(() =>
        useTotalBalances({
          ...portfolioParams,
          isDeployed: false,
          counterfactualResult: [mockCfBalances, undefined, false],
        }),
      )

      expect(result.current.data?.fiatTotal).toBe('500')
    })

    it('should handle loading state', () => {
      jest
        .spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query')
        .mockReturnValue(mockQueryResult({ isLoading: true }))

      const { result } = renderHook(() => useTotalBalances(portfolioParams))

      expect(result.current.loading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('all tokens merged mode', () => {
    const allTokensParams: UseTotalBalancesParams = {
      ...defaultParams,
      hasPortfolioFeature: true,
      isAllTokensSelected: true,
    }

    it('should merge portfolio totals with tx service items', () => {
      const mockPortfolio = createMockPortfolio()
      const mockBalances = createMockTxServiceBalances()

      jest
        .spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query')
        .mockReturnValue(mockQueryResult({ currentData: mockPortfolio }))

      jest
        .spyOn(balancesQueries, 'useBalancesGetBalancesV1Query')
        .mockReturnValue(mockQueryResult({ currentData: mockBalances }))

      const { result } = renderHook(() => useTotalBalances(allTokensParams))

      // fiatTotal from portfolio
      expect(result.current.data?.fiatTotal).toBe('2000')
      // tokensFiatTotal calculated from tx service items
      expect(result.current.data?.tokensFiatTotal).toBe('1000')
      // positionsFiatTotal from portfolio
      expect(result.current.data?.positionsFiatTotal).toBe('500')
      // positions from portfolio
      expect(result.current.data?.positions).toEqual([])
      // items from tx service
      expect(result.current.data?.items).toEqual(mockBalances.items)
      // flag
      expect(result.current.data?.isAllTokensMode).toBe(true)
    })

    it('should show loading when either source is loading', () => {
      jest
        .spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query')
        .mockReturnValue(mockQueryResult({ isLoading: true }))

      const { result } = renderHook(() => useTotalBalances(allTokensParams))

      expect(result.current.loading).toBe(true)
    })

    it('should show error when either source errors', () => {
      const mockPortfolio = createMockPortfolio()

      jest
        .spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query')
        .mockReturnValue(mockQueryResult({ currentData: mockPortfolio }))

      jest
        .spyOn(balancesQueries, 'useBalancesGetBalancesV1Query')
        .mockReturnValue(mockQueryResult({ error: new Error('TX error') }))

      const { result } = renderHook(() => useTotalBalances(allTokensParams))

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('skip and readiness', () => {
    it('should return empty result when skip is true', () => {
      const { result } = renderHook(() => useTotalBalances({ ...defaultParams, skip: true }))

      expect(result.current.data).toBeUndefined()
      expect(result.current.error).toBeUndefined()
      expect(result.current.loading).toBe(false)
    })

    it('should skip queries when trusted is undefined', () => {
      const balancesSpy = jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query')

      renderHook(() => useTotalBalances({ ...defaultParams, trusted: undefined }))

      // The query should be called with skip: true (trusted=undefined means chain not ready)
      expect(balancesSpy).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }))
    })

    it('should pass currency through as-is for consistent cache keys', () => {
      const portfolioSpy = jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query')

      renderHook(() => useTotalBalances({ ...defaultParams, hasPortfolioFeature: true, currency: 'usd' }))

      expect(portfolioSpy).toHaveBeenCalledWith(expect.objectContaining({ fiatCode: 'usd' }), expect.anything())
    })
  })

  describe('refetch', () => {
    it('should call portfolio refetch when portfolio feature is enabled', () => {
      const portfolioRefetch = jest.fn()
      jest
        .spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query')
        .mockReturnValue(mockQueryResult({ refetch: portfolioRefetch }))

      const { result } = renderHook(() =>
        useTotalBalances({ ...defaultParams, hasPortfolioFeature: true, isAllTokensSelected: false }),
      )

      result.current.refetch()

      expect(portfolioRefetch).toHaveBeenCalled()
    })

    it('should call both refetches in all tokens mode', () => {
      const portfolioRefetch = jest.fn()
      const txServiceRefetch = jest.fn()

      jest
        .spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query')
        .mockReturnValue(mockQueryResult({ refetch: portfolioRefetch }))

      jest
        .spyOn(balancesQueries, 'useBalancesGetBalancesV1Query')
        .mockReturnValue(mockQueryResult({ refetch: txServiceRefetch }))

      const { result } = renderHook(() =>
        useTotalBalances({ ...defaultParams, hasPortfolioFeature: true, isAllTokensSelected: true }),
      )

      result.current.refetch()

      expect(portfolioRefetch).toHaveBeenCalled()
      expect(txServiceRefetch).toHaveBeenCalled()
    })
  })
})
