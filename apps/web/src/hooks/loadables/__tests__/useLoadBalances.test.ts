import { renderHook, waitFor } from '@/tests/test-utils'
import useLoadBalances from '@/hooks/loadables/useLoadBalances'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as useChains from '@/hooks/useChains'
import * as store from '@/store'
import * as balancesQueries from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import * as portfolioQueries from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import * as useCounterfactualBalances from '@/features/counterfactual/useCounterfactualBalances'
import * as usePortfolioBalances from '@/features/portfolio/hooks/usePortfolioBalances'
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

    jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => {
      if (feature === FEATURES.PORTFOLIO_ENDPOINT) {
        return mockChain.features.includes(FEATURES.PORTFOLIO_ENDPOINT) ? true : false
      }
      if (feature === FEATURES.DEFAULT_TOKENLIST) {
        return mockChain.features.includes(FEATURES.DEFAULT_TOKENLIST) ? true : false
      }
      return false
    })

    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(mockChain)

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
      } as unknown as store.RootState),
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
      jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => {
        if (feature === FEATURES.PORTFOLIO_ENDPOINT) {
          return true
        }
        if (feature === FEATURES.DEFAULT_TOKENLIST) {
          return mockChain.features.includes(FEATURES.DEFAULT_TOKENLIST) ? true : false
        }
        return false
      })

      // Set token list to TRUSTED to use portfolio endpoint (ALL uses legacy)
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
            tokenList: TOKEN_LISTS.TRUSTED,
          },
        } as unknown as store.RootState),
      )
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

    it('should return portfolio balances for counterfactual safe with empty portfolio', async () => {
      const mockPortfolio = createMockEmptyPortfolio()

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

      const { result } = renderHook(() => useLoadBalances())

      await waitFor(() => {
        expect(result.current[0]).toBeDefined()
      })

      const [balances, error, loading] = result.current

      // Portfolio endpoint natively supports counterfactual Safes
      expect(balances?.fiatTotal).toBe(mockPortfolio.totalBalanceFiat)
      expect(balances?.tokensFiatTotal).toBe(mockPortfolio.totalTokenBalanceFiat)
      expect(balances?.positionsFiatTotal).toBe(mockPortfolio.totalPositionsBalanceFiat)
      expect(balances?.positions).toEqual(mockPortfolio.positionBalances)
      expect(error).toBeUndefined()
      expect(loading).toBe(false)
    })

    it('should return portfolio balances for counterfactual safe with non-empty portfolio', async () => {
      const mockPortfolio = createMockPortfolio()

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

      const { result } = renderHook(() => useLoadBalances())

      await waitFor(() => {
        expect(result.current[0]).toBeDefined()
      })

      const [balances] = result.current

      // Portfolio endpoint natively supports counterfactual Safes
      expect(balances?.fiatTotal).toBe(mockPortfolio.totalBalanceFiat)
      expect(balances?.tokensFiatTotal).toBe(mockPortfolio.totalTokenBalanceFiat)
    })

    it('should fallback to legacy endpoint when portfolio fails', async () => {
      const mockPortfolioError = new Error('Portfolio endpoint error')
      const mockLegacyBalances = createMockLegacyBalances()

      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        currentData: undefined,
        isLoading: false,
        error: mockPortfolioError,
        refetch: jest.fn(),
      } as any)

      jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockReturnValue({
        currentData: mockLegacyBalances,
        isLoading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useLoadBalances())

      await waitFor(() => {
        expect(result.current[0]).toBeDefined()
      })

      const [balances, error] = result.current

      // Should fallback to legacy balances when portfolio fails
      expect(balances?.fiatTotal).toBe(mockLegacyBalances.fiatTotal)
      expect(error).toBeUndefined()
    })

    it('should return error when both portfolio and legacy fail', async () => {
      const mockPortfolioError = new Error('Portfolio endpoint error')
      const mockLegacyError = new Error('Legacy endpoint error')

      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        currentData: undefined,
        isLoading: false,
        error: mockPortfolioError,
        refetch: jest.fn(),
      } as any)

      jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockReturnValue({
        currentData: undefined,
        isLoading: false,
        error: mockLegacyError,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useLoadBalances())

      await waitFor(() => {
        expect(result.current[1]).toBeDefined()
      })

      const [balances, error] = result.current

      expect(balances).toBeUndefined()
      expect(error).toBeInstanceOf(Error)
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

    it('should use legacy endpoint when "All tokens" is selected', async () => {
      const mockLegacyBalances = createMockLegacyBalances()
      const mockPortfolio = createMockPortfolio()

      // Set token list to ALL
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
        } as unknown as store.RootState),
      )

      jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockReturnValue({
        currentData: mockLegacyBalances,
        isLoading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

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

      // Should return merged mode: portfolio fiatTotal/positions + legacy token items
      expect(balances?.fiatTotal).toBe(mockPortfolio.totalBalanceFiat)
      expect(balances?.tokensFiatTotal).toBe(mockLegacyBalances.fiatTotal)
      expect(balances?.positionsFiatTotal).toBe(mockPortfolio.totalPositionsBalanceFiat)
      expect(balances?.positions).toEqual(mockPortfolio.positionBalances)
      expect(balances?.items).toEqual(mockLegacyBalances.items)
      expect(balances?.isAllTokensMode).toBe(true)
      expect(error).toBeUndefined()
      expect(loading).toBe(false)
    })

    it('should use portfolio endpoint when "Default tokens" is selected', async () => {
      const mockLegacyBalances = createMockLegacyBalances()
      const mockPortfolio = createMockPortfolio()

      // Set token list to TRUSTED
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
            tokenList: TOKEN_LISTS.TRUSTED,
          },
        } as unknown as store.RootState),
      )

      jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockReturnValue({
        currentData: mockLegacyBalances,
        isLoading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

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

      // Should return portfolio balances when "Default tokens" is selected and portfolio feature is enabled
      expect(balances?.fiatTotal).toBe(mockPortfolio.totalBalanceFiat)
      expect(balances?.tokensFiatTotal).toBe(mockPortfolio.totalTokenBalanceFiat)
      expect(balances?.positionsFiatTotal).toBe(mockPortfolio.totalPositionsBalanceFiat)
      expect(balances?.positions).toEqual(mockPortfolio.positionBalances)
      expect(error).toBeUndefined()
      expect(loading).toBe(false)
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

      jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => {
        if (feature === FEATURES.PORTFOLIO_ENDPOINT) {
          return true
        }
        if (feature === FEATURES.DEFAULT_TOKENLIST) {
          return chainWithPortfolio.features.includes(FEATURES.DEFAULT_TOKENLIST) ? true : false
        }
        return false
      })

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

      jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => {
        if (feature === FEATURES.PORTFOLIO_ENDPOINT) {
          return true
        }
        if (feature === FEATURES.DEFAULT_TOKENLIST) {
          return chainWithPortfolio.features.includes(FEATURES.DEFAULT_TOKENLIST) ? true : false
        }
        return false
      })

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

  describe('merged mode (All tokens with portfolio enabled)', () => {
    const mockMergedPortfolio: Portfolio = {
      totalBalanceFiat: '5000',
      totalTokenBalanceFiat: '3000',
      totalPositionsBalanceFiat: '2000',
      tokenBalances: [
        {
          tokenInfo: {
            address: toBeHex('0x10', 20),
            decimals: 18,
            logoUri: 'https://portfolio.com/token.png',
            name: 'Portfolio Token',
            symbol: 'PT',
            type: 'ERC20' as const,
            chainId: CHAIN_ID,
            trusted: true,
          },
          balance: '3000000000000000000',
          balanceFiat: '3000',
          price: '1000',
          priceChangePercentage1d: '0.05',
        },
      ],
      positionBalances: [
        {
          appInfo: { name: 'Aave', logoUrl: 'https://aave.com/logo.png', url: 'https://aave.com' },
          balanceFiat: '2000',
          groups: [],
        },
      ],
    }

    const mockLegacyBalancesWithMultipleTokens: Balances = {
      fiatTotal: '1500',
      items: [
        {
          balance: '1000000000000000000',
          fiatBalance: '800',
          fiatConversion: '800',
          tokenInfo: {
            address: toBeHex('0x20', 20),
            decimals: 18,
            logoUri: '',
            name: 'Legacy Token A',
            symbol: 'LTA',
            type: TokenType.ERC20,
          },
        },
        {
          balance: '500000000000000000',
          fiatBalance: '700',
          fiatConversion: '700',
          tokenInfo: {
            address: toBeHex('0x21', 20),
            decimals: 18,
            logoUri: '',
            name: 'Legacy Token B',
            symbol: 'LTB',
            type: TokenType.ERC20,
          },
        },
      ],
    }

    beforeEach(() => {
      jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => {
        if (feature === FEATURES.PORTFOLIO_ENDPOINT) {
          return true
        }
        if (feature === FEATURES.DEFAULT_TOKENLIST) {
          return true
        }
        return false
      })

      jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(mockChain)

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
        } as unknown as store.RootState),
      )
    })

    it('should return merged data with portfolio fiatTotal and positions, legacy token items', async () => {
      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        currentData: mockMergedPortfolio,
        isLoading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockReturnValue({
        currentData: mockLegacyBalancesWithMultipleTokens,
        isLoading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useLoadBalances())

      await waitFor(() => {
        expect(result.current[0]).toBeDefined()
      })

      const [balances, error, loading] = result.current

      // fiatTotal should come from portfolio (not legacy)
      expect(balances?.fiatTotal).toBe(mockMergedPortfolio.totalBalanceFiat)
      // positionsFiatTotal should come from portfolio
      expect(balances?.positionsFiatTotal).toBe(mockMergedPortfolio.totalPositionsBalanceFiat)
      // positions should come from portfolio
      expect(balances?.positions).toEqual(mockMergedPortfolio.positionBalances)
      // items (token list) should come from legacy
      expect(balances?.items).toHaveLength(2)
      expect(balances?.items[0]?.tokenInfo.name).toBe('Legacy Token A')
      expect(balances?.items[1]?.tokenInfo.name).toBe('Legacy Token B')
      // tokensFiatTotal should be calculated from legacy items (800 + 700 = 1500)
      expect(balances?.tokensFiatTotal).toBe('1500')
      // isAllTokensMode flag should be true
      expect(balances?.isAllTokensMode).toBe(true)

      expect(error).toBeUndefined()
      expect(loading).toBe(false)
    })

    it('should calculate tokensFiatTotal from legacy token fiat values', async () => {
      const legacyWithVariedValues: Balances = {
        fiatTotal: '1000',
        items: [
          {
            balance: '1000000000000000000',
            fiatBalance: '250.50',
            fiatConversion: '250.50',
            tokenInfo: {
              address: toBeHex('0x30', 20),
              decimals: 18,
              logoUri: '',
              name: 'Token A',
              symbol: 'TA',
              type: TokenType.ERC20,
            },
          },
          {
            balance: '500000000000000000',
            fiatBalance: '100.25',
            fiatConversion: '100.25',
            tokenInfo: {
              address: toBeHex('0x31', 20),
              decimals: 18,
              logoUri: '',
              name: 'Token B',
              symbol: 'TB',
              type: TokenType.ERC20,
            },
          },
          {
            balance: '200000000000000000',
            fiatBalance: '0',
            fiatConversion: '0',
            tokenInfo: {
              address: toBeHex('0x32', 20),
              decimals: 18,
              logoUri: '',
              name: 'Zero Value Token',
              symbol: 'ZVT',
              type: TokenType.ERC20,
            },
          },
        ],
      }

      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        currentData: mockMergedPortfolio,
        isLoading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockReturnValue({
        currentData: legacyWithVariedValues,
        isLoading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useLoadBalances())

      await waitFor(() => {
        expect(result.current[0]).toBeDefined()
      })

      const [balances] = result.current

      // tokensFiatTotal should be sum of legacy fiatBalance values: 250.50 + 100.25 + 0 = 350.75
      expect(parseFloat(balances?.tokensFiatTotal || '0')).toBeCloseTo(350.75, 2)
    })

    it('should return loading when portfolio endpoint is loading', async () => {
      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        currentData: undefined,
        isLoading: true,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockReturnValue({
        currentData: mockLegacyBalancesWithMultipleTokens,
        isLoading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useLoadBalances())

      expect(result.current[2]).toBe(true)
    })

    it('should return loading when legacy endpoint is loading', async () => {
      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        currentData: mockMergedPortfolio,
        isLoading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockReturnValue({
        currentData: undefined,
        isLoading: true,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useLoadBalances())

      expect(result.current[2]).toBe(true)
    })

    it('should handle portfolio error gracefully in merged mode', async () => {
      jest.spyOn(useCounterfactualBalances, 'useCounterfactualBalances').mockReturnValue([undefined, undefined, false])

      jest.spyOn(usePortfolioBalances, 'default').mockReturnValue([undefined, new Error('Portfolio error'), false])

      jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockReturnValue({
        currentData: mockLegacyBalancesWithMultipleTokens,
        isLoading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useLoadBalances())

      await waitFor(() => {
        expect(result.current[1]).toBeDefined()
        expect(result.current[1]).toBeInstanceOf(Error)
      })

      // Should return error when portfolio fails (since we need portfolio for fiatTotal)
      expect(result.current[1]?.message).toContain('Portfolio error')
    })

    it('should handle legacy error gracefully in merged mode', async () => {
      jest.spyOn(useCounterfactualBalances, 'useCounterfactualBalances').mockReturnValue([undefined, undefined, false])

      const portfolioBalances = {
        items: mockMergedPortfolio.tokenBalances.map((t) => ({
          tokenInfo: { ...t.tokenInfo, logoUri: t.tokenInfo.logoUri || '' },
          balance: t.balance,
          fiatBalance: t.balanceFiat || '0',
          fiatConversion: t.price || '0',
        })),
        fiatTotal: mockMergedPortfolio.totalBalanceFiat,
        tokensFiatTotal: mockMergedPortfolio.totalTokenBalanceFiat,
        positionsFiatTotal: mockMergedPortfolio.totalPositionsBalanceFiat,
        positions: mockMergedPortfolio.positionBalances,
      }

      jest.spyOn(usePortfolioBalances, 'default').mockReturnValue([portfolioBalances, undefined, false])

      jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockReturnValue({
        currentData: undefined,
        isLoading: false,
        error: new Error('Legacy error'),
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useLoadBalances())

      await waitFor(() => {
        expect(result.current[1]).toBeDefined()
        expect(result.current[1]).toBeInstanceOf(Error)
      })

      expect(result.current[1]?.message).toContain('Legacy error')
    })

    it('should set isAllTokensMode to false when Default tokens is selected', async () => {
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
            tokenList: TOKEN_LISTS.TRUSTED,
          },
        } as unknown as store.RootState),
      )

      const portfolioBalances = {
        items: mockMergedPortfolio.tokenBalances.map((t) => ({
          tokenInfo: { ...t.tokenInfo, logoUri: t.tokenInfo.logoUri || '' },
          balance: t.balance,
          fiatBalance: t.balanceFiat || '0',
          fiatConversion: t.price || '0',
        })),
        fiatTotal: mockMergedPortfolio.totalBalanceFiat,
        tokensFiatTotal: mockMergedPortfolio.totalTokenBalanceFiat,
        positionsFiatTotal: mockMergedPortfolio.totalPositionsBalanceFiat,
        positions: mockMergedPortfolio.positionBalances,
      }

      jest.spyOn(usePortfolioBalances, 'default').mockReturnValue([portfolioBalances, undefined, false])

      const { result } = renderHook(() => useLoadBalances())

      await waitFor(() => {
        expect(result.current[0]).toBeDefined()
      })

      const [balances] = result.current

      expect(balances?.isAllTokensMode).toBeFalsy()
    })
  })
})
