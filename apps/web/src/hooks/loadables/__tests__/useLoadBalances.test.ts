import { renderHook, waitFor } from '@/tests/test-utils'
import useLoadBalances from '@/hooks/loadables/useLoadBalances'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as useCurrentChain from '@/hooks/useChains'
import * as store from '@/store'
import * as balancesQueries from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import * as portfolioQueries from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import * as useCounterfactualBalances from '@/features/counterfactual/useCounterfactualBalances'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { chainBuilder } from '@/tests/builders/chains'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { TokenType } from '@safe-global/store/gateway/types'
import { toBeHex } from 'ethers'
import type { Portfolio } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

const SAFE_ADDRESS = toBeHex('0x1234', 20)
const CHAIN_ID = '5'

const createMockLegacyBalances = (): Balances => ({
  fiatTotal: '1000',
  items: [
    {
      balance: '1000000000000000000',
      fiatBalance: '1000',
      fiatConversion: '1000',
      tokenInfo: {
        address: toBeHex('0x1', 20),
        decimals: 18,
        logoUri: '',
        name: 'Test Token',
        symbol: 'TEST',
        type: TokenType.ERC20,
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
  positionBalances: [],
})

const createMockEmptyPortfolio = (): Portfolio => ({
  totalBalanceFiat: '0',
  totalTokenBalanceFiat: '0',
  totalPositionsBalanceFiat: '0',
  tokenBalances: [],
  positionBalances: [],
})

const createMockCounterfactualBalances = (): Balances => ({
  fiatTotal: '0',
  items: [
    {
      balance: '500000000000000000',
      fiatBalance: '0',
      fiatConversion: '0',
      tokenInfo: {
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        logoUri: '',
        name: 'Ether',
        symbol: 'ETH',
        type: TokenType.NATIVE_TOKEN,
      },
    },
  ],
})

describe('useLoadBalances', () => {
  const mockChain = chainBuilder().with({ chainId: CHAIN_ID, features: [] }).build()
  const mockDeployedSafe = extendedSafeInfoBuilder()
    .with({
      address: { value: SAFE_ADDRESS },
      chainId: CHAIN_ID,
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

    jest.spyOn(useCurrentChain, 'useCurrentChain').mockReturnValue(mockChain)

    jest.spyOn(store, 'useAppSelector').mockImplementation((selector) =>
      selector({
        chains: {
          data: [mockChain],
        },
        safeInfo: {
          data: mockDeployedSafe,
          loading: false,
          loaded: true,
        },
        settings: {
          currency: 'USD',
          hiddenTokens: {},
          shortName: {
            copy: true,
            qr: true,
          },
          theme: {},
          tokenList: TOKEN_LISTS.ALL,
        },
      } as store.RootState),
    )

    jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockReturnValue({
      currentData: undefined,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    } as any)

    jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
      currentData: undefined,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    } as any)

    jest.spyOn(useCounterfactualBalances, 'useCounterfactualBalances').mockReturnValue([undefined, undefined, false])
  })

  describe('legacy endpoint', () => {
    it('should return legacy balances when portfolio endpoint is disabled', async () => {
      const mockBalances = createMockLegacyBalances()

      jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockReturnValue({
        currentData: mockBalances,
        isLoading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useLoadBalances())

      await waitFor(() => {
        expect(result.current[0]).toBeDefined()
      })

      const [balances, error, loading] = result.current

      expect(balances?.fiatTotal).toBe(mockBalances.fiatTotal)
      expect(balances?.tokensFiatTotal).toBe(mockBalances.fiatTotal)
      expect(balances?.positionsFiatTotal).toBe('0')
      expect(balances?.positions).toBeUndefined()
      expect(error).toBeUndefined()
      expect(loading).toBe(false)
    })

    it('should return counterfactual balances for counterfactual safe with legacy endpoint', async () => {
      const mockCfBalances = createMockCounterfactualBalances()

      jest.spyOn(useSafeInfo, 'default').mockReturnValue({
        safe: mockCounterfactualSafe,
        safeAddress: SAFE_ADDRESS,
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      jest
        .spyOn(useCounterfactualBalances, 'useCounterfactualBalances')
        .mockReturnValue([mockCfBalances, undefined, false])

      const { result } = renderHook(() => useLoadBalances())

      await waitFor(() => {
        expect(result.current[0]).toBeDefined()
      })

      const [balances, error, loading] = result.current

      expect(balances?.fiatTotal).toBe(mockCfBalances.fiatTotal)
      expect(balances?.tokensFiatTotal).toBe(mockCfBalances.fiatTotal)
      expect(balances?.positionsFiatTotal).toBe('0')
      expect(balances?.positions).toBeUndefined()
      expect(error).toBeUndefined()
      expect(loading).toBe(false)
    })

    it('should handle legacy endpoint errors', async () => {
      const mockError = new Error('Legacy endpoint error')

      jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockReturnValue({
        currentData: undefined,
        isLoading: false,
        error: mockError,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useLoadBalances())

      await waitFor(() => {
        expect(result.current[1]).toBeDefined()
      })

      const [balances, error] = result.current

      expect(balances).toBeUndefined()
      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toBe('Error: Legacy endpoint error')
    })
  })

  describe('portfolio endpoint', () => {
    beforeEach(() => {
      const chainWithPortfolio = chainBuilder()
        .with({ chainId: CHAIN_ID, features: [FEATURES.PORTFOLIO_ENDPOINT] })
        .build()

      jest.spyOn(useCurrentChain, 'useCurrentChain').mockReturnValue(chainWithPortfolio)
    })

    it('should return portfolio balances when portfolio endpoint is enabled', async () => {
      const mockPortfolio = createMockPortfolio()

      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        currentData: mockPortfolio,
        isLoading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useLoadBalances())

      await waitFor(() => {
        expect(result.current[0]).toBeDefined()
      })

      const [balances, error, loading] = result.current

      expect(balances?.fiatTotal).toBe(mockPortfolio.totalBalanceFiat)
      expect(balances?.tokensFiatTotal).toBe(mockPortfolio.totalTokenBalanceFiat)
      expect(balances?.positionsFiatTotal).toBe(mockPortfolio.totalPositionsBalanceFiat)
      expect(balances?.positions).toEqual(mockPortfolio.positionBalances)
      expect(balances?.items).toHaveLength(1)
      expect(balances?.items[0]?.tokenInfo.logoUri).toBe('https://example.com/logo.png')
      expect(error).toBeUndefined()
      expect(loading).toBe(false)
    })

    it('should return counterfactual balances for counterfactual safe with empty portfolio', async () => {
      const mockPortfolio = createMockEmptyPortfolio()
      const mockCfBalances = createMockCounterfactualBalances()

      jest.spyOn(useSafeInfo, 'default').mockReturnValue({
        safe: mockCounterfactualSafe,
        safeAddress: SAFE_ADDRESS,
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        currentData: mockPortfolio,
        isLoading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      jest
        .spyOn(useCounterfactualBalances, 'useCounterfactualBalances')
        .mockReturnValue([mockCfBalances, undefined, false])

      const { result } = renderHook(() => useLoadBalances())

      await waitFor(() => {
        expect(result.current[0]).toBeDefined()
      })

      const [balances, error, loading] = result.current

      expect(balances?.fiatTotal).toBe(mockCfBalances.fiatTotal)
      expect(balances?.tokensFiatTotal).toBe(mockCfBalances.fiatTotal)
      expect(balances?.positionsFiatTotal).toBe('0')
      expect(balances?.positions).toBeUndefined()
      expect(error).toBeUndefined()
      expect(loading).toBe(false)
    })

    it('should return portfolio balances for counterfactual safe with non-empty portfolio', async () => {
      const mockPortfolio = createMockPortfolio()
      const mockCfBalances = createMockCounterfactualBalances()

      jest.spyOn(useSafeInfo, 'default').mockReturnValue({
        safe: mockCounterfactualSafe,
        safeAddress: SAFE_ADDRESS,
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        currentData: mockPortfolio,
        isLoading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      jest
        .spyOn(useCounterfactualBalances, 'useCounterfactualBalances')
        .mockReturnValue([mockCfBalances, undefined, false])

      const { result } = renderHook(() => useLoadBalances())

      await waitFor(() => {
        expect(result.current[0]).toBeDefined()
      })

      const [balances] = result.current

      expect(balances?.fiatTotal).toBe(mockPortfolio.totalBalanceFiat)
      expect(balances?.tokensFiatTotal).toBe(mockPortfolio.totalTokenBalanceFiat)
    })

    it('should handle portfolio endpoint errors', async () => {
      const mockError = new Error('Portfolio endpoint error')

      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        currentData: undefined,
        isLoading: false,
        error: mockError,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useLoadBalances())

      await waitFor(() => {
        expect(result.current[1]).toBeDefined()
      })

      const [balances, error] = result.current

      expect(balances).toBeUndefined()
      expect(error).toBeInstanceOf(Error)
      expect(error?.message).toBe('Error: Portfolio endpoint error')
    })

    it('should handle loading state', async () => {
      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        currentData: undefined,
        isLoading: true,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useLoadBalances())

      expect(result.current[2]).toBe(true)
    })

    it('should transform portfolio data correctly', async () => {
      const mockPortfolio: Portfolio = {
        totalBalanceFiat: '3000',
        totalTokenBalanceFiat: '2000',
        totalPositionsBalanceFiat: '1000',
        tokenBalances: [
          {
            tokenInfo: {
              address: toBeHex('0x3', 20),
              decimals: 18,
              logoUri: '',
              name: 'Token Without Logo',
              symbol: 'TWL',
              type: 'ERC20' as const,
              chainId: CHAIN_ID,
              trusted: true,
            },
            balance: '1000000000000000000',
            balanceFiat: '2000',
            price: '2000',
            priceChangePercentage1d: '-0.1',
          },
        ],
        positionBalances: [],
      }

      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        currentData: mockPortfolio,
        isLoading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useLoadBalances())

      await waitFor(() => {
        expect(result.current[0]).toBeDefined()
      })

      const [balances] = result.current

      expect(balances?.items[0]?.tokenInfo.logoUri).toBe('')
      expect(balances?.items[0]?.fiatBalance).toBe('2000')
      expect(balances?.items[0]?.fiatConversion).toBe('2000')
      expect(balances?.items[0]?.fiatBalance24hChange).toBe('-0.1')
    })
  })

  describe('edge cases', () => {
    it('should handle undefined portfolio data', async () => {
      const chainWithPortfolio = chainBuilder()
        .with({ chainId: CHAIN_ID, features: [FEATURES.PORTFOLIO_ENDPOINT] })
        .build()

      jest.spyOn(useCurrentChain, 'useCurrentChain').mockReturnValue(chainWithPortfolio)

      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        currentData: undefined,
        isLoading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useLoadBalances())

      await waitFor(() => {
        expect(result.current[0]).toBeUndefined()
      })
    })

    it('should handle missing safe address', async () => {
      jest.spyOn(useSafeInfo, 'default').mockReturnValue({
        safe: mockDeployedSafe,
        safeAddress: '',
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      const { result } = renderHook(() => useLoadBalances())

      await waitFor(() => {
        expect(result.current[0]).toBeUndefined()
      })
    })

    it('should handle missing chain ID', async () => {
      const chainWithPortfolio = chainBuilder()
        .with({ chainId: CHAIN_ID, features: [FEATURES.PORTFOLIO_ENDPOINT] })
        .build()

      jest.spyOn(useCurrentChain, 'useCurrentChain').mockReturnValue(chainWithPortfolio)

      jest.spyOn(useSafeInfo, 'default').mockReturnValue({
        safe: { ...mockDeployedSafe, chainId: '' },
        safeAddress: SAFE_ADDRESS,
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      const { result } = renderHook(() => useLoadBalances())

      await waitFor(() => {
        expect(result.current[0]).toBeUndefined()
      })
    })
  })
})
