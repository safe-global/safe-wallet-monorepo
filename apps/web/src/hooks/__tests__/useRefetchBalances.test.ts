import { renderHook, waitFor } from '@/tests/test-utils'
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
})
