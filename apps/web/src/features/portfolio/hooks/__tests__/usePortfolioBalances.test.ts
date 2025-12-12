import { renderHook, waitFor } from '@/tests/test-utils'
import usePortfolioBalances from '@/features/portfolio/hooks/usePortfolioBalances'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as useChains from '@/hooks/useChains'
import * as store from '@/store'
import * as portfolioQueries from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import * as useLoadBalances from '@/hooks/loadables/useLoadBalances'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { chainBuilder } from '@/tests/builders/chains'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { toBeHex } from 'ethers'
import type { Portfolio } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'

const SAFE_ADDRESS = toBeHex('0x1234', 20)
const CHAIN_ID = '5'

const createMockPortfolio = (): Portfolio => ({
  totalBalanceFiat: '2000',
  totalTokenBalanceFiat: '1500',
  totalPositionsBalanceFiat: '500',
  tokenBalances: [
    {
      tokenInfo: {
        address: toBeHex('0x2', 20),
        decimals: 18,
        logoUri: 'https://example.com/logo.png',
        name: 'Portfolio Token',
        symbol: 'PT',
        type: 'ERC20' as const,
        chainId: CHAIN_ID,
        trusted: true,
      },
      balance: '2000000000000000000',
      balanceFiat: '2000',
      price: '1000',
      priceChangePercentage1d: '0.05',
    },
  ],
  positionBalances: [
    {
      appInfo: { name: 'Aave', logoUrl: 'https://aave.com/logo.png', url: 'https://aave.com' },
      balanceFiat: '500',
      groups: [],
    },
  ],
})

const createMockEmptyPortfolio = (): Portfolio => ({
  totalBalanceFiat: '0',
  totalTokenBalanceFiat: '0',
  totalPositionsBalanceFiat: '0',
  tokenBalances: [],
  positionBalances: [],
})

describe('usePortfolioBalances', () => {
  const mockChain = chainBuilder()
    .with({ chainId: CHAIN_ID, features: [FEATURES.PORTFOLIO_ENDPOINT] })
    .build()
  const mockDeployedSafe = extendedSafeInfoBuilder()
    .with({
      address: { value: SAFE_ADDRESS },
      chainId: CHAIN_ID,
      deployed: true,
    })
    .build()
  const mockCounterfactualSafe = extendedSafeInfoBuilder()
    .with({
      address: { value: SAFE_ADDRESS },
      chainId: CHAIN_ID,
      deployed: false,
    })
    .build()

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()

    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: mockDeployedSafe,
      safeAddress: SAFE_ADDRESS,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(mockChain)

    jest.spyOn(store, 'useAppSelector').mockImplementation((selector) =>
      selector({
        chains: { data: [mockChain] },
        safeInfo: { data: mockDeployedSafe, loading: false, loaded: true },
        settings: {
          currency: 'USD',
          hiddenTokens: {},
          shortName: { copy: true, qr: true },
          theme: {},
          tokenList: TOKEN_LISTS.TRUSTED,
        },
      } as unknown as store.RootState),
    )

    jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
      currentData: undefined,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    } as any)

    jest.spyOn(useLoadBalances, 'useTxServiceBalances').mockReturnValue([undefined, undefined, false])
  })

  describe('when skip is true', () => {
    it('should return undefined data without loading', async () => {
      const { result } = renderHook(() => usePortfolioBalances(true))

      await waitFor(() => {
        expect(result.current[0]).toBeUndefined()
        expect(result.current[1]).toBeUndefined()
        expect(result.current[2]).toBe(false)
      })
    })
  })

  describe('portfolio endpoint success', () => {
    it('should transform portfolio data to balances format', async () => {
      const mockPortfolio = createMockPortfolio()

      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        currentData: mockPortfolio,
        isLoading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => usePortfolioBalances(false))

      await waitFor(() => {
        expect(result.current[0]).toBeDefined()
      })

      const [balances, error, loading] = result.current

      expect(balances?.fiatTotal).toBe('2000')
      expect(balances?.tokensFiatTotal).toBe('1500')
      expect(balances?.positionsFiatTotal).toBe('500')
      expect(balances?.items).toHaveLength(1)
      expect(balances?.items[0].tokenInfo.name).toBe('Portfolio Token')
      expect(balances?.items[0].fiatBalance24hChange).toBe('0.05')
      expect(balances?.positions).toHaveLength(1)
      expect(error).toBeUndefined()
      expect(loading).toBe(false)
    })

    it('should handle missing logoUri by setting empty string', async () => {
      const mockPortfolio = createMockPortfolio()
      mockPortfolio.tokenBalances[0].tokenInfo.logoUri = null as any

      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        currentData: mockPortfolio,
        isLoading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => usePortfolioBalances(false))

      await waitFor(() => {
        expect(result.current[0]?.items[0].tokenInfo.logoUri).toBe('')
      })
    })
  })

  describe('loading state', () => {
    it('should return loading true while portfolio is loading', async () => {
      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        currentData: undefined,
        isLoading: true,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => usePortfolioBalances(false))

      await waitFor(() => {
        expect(result.current[2]).toBe(true)
      })
    })
  })

  describe('error handling', () => {
    it('should fallback to transaction service when portfolio endpoint fails for deployed safe', async () => {
      const mockTxServiceBalances = {
        fiatTotal: '500',
        items: [],
        tokensFiatTotal: '500',
        positionsFiatTotal: '0',
      }

      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        currentData: undefined,
        isLoading: false,
        error: 'Network error',
        refetch: jest.fn(),
      } as any)

      jest.spyOn(useLoadBalances, 'useTxServiceBalances').mockReturnValue([mockTxServiceBalances, undefined, false])

      const { result } = renderHook(() => usePortfolioBalances(false))

      await waitFor(() => {
        expect(result.current[0]).toBe(mockTxServiceBalances)
        expect(result.current[1]).toBeUndefined()
      })
    })

    it('should return transaction service error when both portfolio and transaction service fail', async () => {
      const txServiceError = new Error('Transaction service error')

      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        currentData: undefined,
        isLoading: false,
        error: 'Network error',
        refetch: jest.fn(),
      } as any)

      jest.spyOn(useLoadBalances, 'useTxServiceBalances').mockReturnValue([undefined, txServiceError, false])

      const { result } = renderHook(() => usePortfolioBalances(false))

      await waitFor(() => {
        expect(result.current[1]).toBe(txServiceError)
      })
    })
  })

  describe('transaction service fallback', () => {
    it('should fallback to transaction service when portfolio returns empty for deployed safe', async () => {
      const mockEmptyPortfolio = createMockEmptyPortfolio()
      const mockTxServiceBalances = {
        fiatTotal: '1000',
        items: [],
        tokensFiatTotal: '1000',
        positionsFiatTotal: '0',
      }

      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        currentData: mockEmptyPortfolio,
        isLoading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      jest.spyOn(useLoadBalances, 'useTxServiceBalances').mockReturnValue([mockTxServiceBalances, undefined, false])

      const { result } = renderHook(() => usePortfolioBalances(false))

      await waitFor(() => {
        expect(result.current[0]).toBe(mockTxServiceBalances)
      })
    })

    it('should NOT fallback for counterfactual safe with empty portfolio', async () => {
      const mockEmptyPortfolio = createMockEmptyPortfolio()

      jest.spyOn(useSafeInfo, 'default').mockReturnValue({
        safe: mockCounterfactualSafe,
        safeAddress: SAFE_ADDRESS,
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        currentData: mockEmptyPortfolio,
        isLoading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => usePortfolioBalances(false))

      await waitFor(() => {
        expect(result.current[0]).toBeDefined()
        expect(result.current[0]?.fiatTotal).toBe('0')
      })
    })

    it('should fallback to transaction service on portfolio error', async () => {
      const mockTxServiceBalances = {
        fiatTotal: '500',
        items: [],
        tokensFiatTotal: '500',
        positionsFiatTotal: '0',
      }

      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        currentData: undefined,
        isLoading: false,
        error: 'API Error',
        refetch: jest.fn(),
      } as any)

      jest.spyOn(useLoadBalances, 'useTxServiceBalances').mockReturnValue([mockTxServiceBalances, undefined, false])

      const { result } = renderHook(() => usePortfolioBalances(false))

      await waitFor(() => {
        expect(result.current[0]).toBe(mockTxServiceBalances)
      })
    })
  })
})
