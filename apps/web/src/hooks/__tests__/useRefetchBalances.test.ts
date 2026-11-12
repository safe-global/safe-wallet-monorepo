import { http, HttpResponse } from 'msw'
import { act, fakerChecksummedAddress, renderHook, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import { getStoreInstance } from '@/store'
import { portfolioSummariesRtkApi } from '@safe-global/store/gateway/portfolioSummaries'
import { useRefetchBalances } from '@/hooks/useRefetchBalances'
import * as useChainId from '@/hooks/useChainId'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as useChains from '@/hooks/useChains'
import * as useLoadBalances from '@/hooks/loadables/useLoadBalances'
import * as positionsQueries from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import * as balancesQueries from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import * as portfolioQueries from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import * as store from '@/store'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { toBeHex } from 'ethers'
import { FEATURES } from '@safe-global/utils/utils/chains'

const SAFE_ADDRESS = toBeHex('0x1234', 20)
const CHAIN_ID = '5'

describe('useRefetchBalances', () => {
  const mockSafe = extendedSafeInfoBuilder()
    .with({
      address: { value: SAFE_ADDRESS },
      chainId: CHAIN_ID,
      deployed: true,
    })
    .build()

  const mockRefetch = jest.fn().mockResolvedValue({})

  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(useChainId, 'default').mockReturnValue(CHAIN_ID)

    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: mockSafe,
      safeAddress: SAFE_ADDRESS,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    // Mock both PORTFOLIO_ENDPOINT (false) and POSITIONS (true) by default
    jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => {
      if (feature === FEATURES.PORTFOLIO_ENDPOINT) return false
      if (feature === FEATURES.POSITIONS) return true
      return false
    })
    jest.spyOn(useLoadBalances, 'useTokenListSetting').mockReturnValue(true)

    jest.spyOn(store, 'useAppSelector').mockReturnValue('USD')

    jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
      refetch: mockRefetch,
    } as any)

    jest.spyOn(positionsQueries, 'usePositionsGetPositionsV1Query').mockReturnValue({
      refetch: mockRefetch,
    } as any)

    jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockReturnValue({
      refetch: mockRefetch,
    } as any)
  })

  describe('shouldUsePortfolioEndpoint', () => {
    it('should return false when portfolio feature is disabled', async () => {
      jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)

      const { result } = renderHook(() => useRefetchBalances())

      await waitFor(() => {
        expect(result.current.shouldUsePortfolioEndpoint).toBe(false)
      })
    })

    it('should return true when portfolio feature is enabled and positions are enabled', async () => {
      jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => {
        if (feature === FEATURES.PORTFOLIO_ENDPOINT) return true
        if (feature === FEATURES.POSITIONS) return true
        return false
      })

      const { result } = renderHook(() => useRefetchBalances())

      await waitFor(() => {
        expect(result.current.shouldUsePortfolioEndpoint).toBe(true)
      })
    })

    it('should return false when positions feature is disabled', async () => {
      jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => {
        if (feature === FEATURES.PORTFOLIO_ENDPOINT) return true
        if (feature === FEATURES.POSITIONS) return false
        return false
      })

      const { result } = renderHook(() => useRefetchBalances())

      await waitFor(() => {
        expect(result.current.shouldUsePortfolioEndpoint).toBe(false)
      })
    })
  })

  describe('refetch function', () => {
    it('should call portfolio refetch when portfolio endpoint is enabled', async () => {
      const portfolioRefetch = jest.fn().mockResolvedValue({})
      jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)
      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        refetch: portfolioRefetch,
      } as any)

      const { result } = renderHook(() => useRefetchBalances())

      await result.current.refetch()

      expect(portfolioRefetch).toHaveBeenCalled()
    })

    it('should call positions and balances refetch functions when portfolio endpoint is disabled', async () => {
      const positionsRefetch = jest.fn().mockResolvedValue({})
      const txServiceBalancesRefetch = jest.fn().mockResolvedValue({})

      jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)
      jest.spyOn(positionsQueries, 'usePositionsGetPositionsV1Query').mockReturnValue({
        refetch: positionsRefetch,
      } as any)
      jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockReturnValue({
        refetch: txServiceBalancesRefetch,
      } as any)

      const { result } = renderHook(() => useRefetchBalances())

      await result.current.refetch()

      expect(positionsRefetch).toHaveBeenCalled()
      expect(txServiceBalancesRefetch).toHaveBeenCalled()
    })
  })

  describe('refetchPositions function', () => {
    it('should call portfolio refetch when portfolio endpoint is enabled', async () => {
      const portfolioRefetch = jest.fn().mockResolvedValue({})
      jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)
      jest.spyOn(portfolioQueries, 'usePortfolioGetPortfolioV1Query').mockReturnValue({
        refetch: portfolioRefetch,
      } as any)

      const { result } = renderHook(() => useRefetchBalances())

      await result.current.refetchPositions()

      expect(portfolioRefetch).toHaveBeenCalled()
    })

    it('should only call positions refetch when portfolio endpoint is disabled', async () => {
      const positionsRefetch = jest.fn().mockResolvedValue({})
      const txServiceBalancesRefetch = jest.fn().mockResolvedValue({})

      jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)
      jest.spyOn(positionsQueries, 'usePositionsGetPositionsV1Query').mockReturnValue({
        refetch: positionsRefetch,
      } as any)
      jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockReturnValue({
        refetch: txServiceBalancesRefetch,
      } as any)

      const { result } = renderHook(() => useRefetchBalances())

      await result.current.refetchPositions()

      expect(positionsRefetch).toHaveBeenCalled()
      expect(txServiceBalancesRefetch).not.toHaveBeenCalled()
    })
  })

  describe('portfolio summaries', () => {
    const recordSummaryRequests = () => {
      const requests: string[] = []
      server.use(
        http.get(`${GATEWAY_URL}/v2/portfolio/summaries`, ({ request }) => {
          requests.push(new URL(request.url).searchParams.get('safes') ?? '')
          return HttpResponse.json([])
        }),
      )
      return requests
    }

    const subscribeToSummary = async (safeId: string) => {
      const subscription = getStoreInstance().dispatch(
        portfolioSummariesRtkApi.endpoints.portfolioGetSummariesForMany.initiate({
          safes: [safeId],
          currency: 'usd',
          trusted: true,
        }),
      )
      await subscription
      return { unsubscribe: subscription.unsubscribe }
    }

    const mockFeatures = (enabled: FEATURES[]) =>
      jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => enabled.includes(feature))

    it('refetches the summaries holding the Safe after its balances refetch, when the chain has the flag', async () => {
      mockFeatures([FEATURES.PORTFOLIO_ENDPOINT, FEATURES.POSITIONS, FEATURES.PORTFOLIO_SUMMARIES])
      const requests = recordSummaryRequests()
      const { result } = renderHook(() => useRefetchBalances())
      const subscription = await subscribeToSummary(`${CHAIN_ID}:${SAFE_ADDRESS.toUpperCase().replace('0X', '0x')}`)

      await result.current.refetch()

      await waitFor(() => expect(requests).toHaveLength(2))
      subscription.unsubscribe()
    })

    it('leaves the summaries of other Safes alone', async () => {
      mockFeatures([FEATURES.PORTFOLIO_ENDPOINT, FEATURES.POSITIONS, FEATURES.PORTFOLIO_SUMMARIES])
      const requests = recordSummaryRequests()
      const { result } = renderHook(() => useRefetchBalances())
      const subscription = await subscribeToSummary(`${CHAIN_ID}:${fakerChecksummedAddress()}`)

      await result.current.refetch()

      await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
      expect(requests).toHaveLength(1)
      subscription.unsubscribe()
    })

    it('does not refetch summaries when the chain has the flag off', async () => {
      mockFeatures([FEATURES.PORTFOLIO_ENDPOINT, FEATURES.POSITIONS])
      const requests = recordSummaryRequests()
      const { result } = renderHook(() => useRefetchBalances())
      const subscription = await subscribeToSummary(`${CHAIN_ID}:${SAFE_ADDRESS}`)

      await result.current.refetch()

      await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
      expect(requests).toHaveLength(1)
      subscription.unsubscribe()
    })
  })
})
