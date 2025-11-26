import { renderHook, waitFor } from '@/tests/test-utils'
import usePositions from '@/features/positions/hooks/usePositions'
import * as useChainId from '@/hooks/useChainId'
import * as useSafeInfo from '@/hooks/useSafeInfo'
import * as useChains from '@/hooks/useChains'
import * as useIsPositionsFeatureEnabled from '@/features/positions/hooks/useIsPositionsFeatureEnabled'
import * as positionsQueries from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import * as store from '@/store'
import { selectCurrency } from '@/store/settingsSlice'
import * as useBalances from '@/hooks/useBalances'
import { chainBuilder } from '@/tests/builders/chains'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { toBeHex } from 'ethers'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import type { AppBalance } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'

const SAFE_ADDRESS = toBeHex('0x1234', 20)
const CHAIN_ID = '5'

const createMockProtocol = (): Protocol => ({
  protocol: 'Test Protocol',
  protocol_metadata: {
    name: 'Test Protocol',
    icon: {
      url: 'https://example.com/protocol.png',
    },
  },
  fiatTotal: '1000',
  items: [
    {
      name: 'Group A',
      items: [
        {
          balance: '1000000000000000000',
          fiatBalance: '1000',
          fiatConversion: '1000',
          tokenInfo: {
            address: toBeHex('0x1', 20),
            decimals: 18,
            logoUri: 'https://example.com/token.png',
            name: 'Test Token',
            symbol: 'TEST',
            type: 'ERC20',
          },
          fiatBalance24hChange: '0.05',
          position_type: 'deposit',
        },
      ],
    },
  ],
})

const createMockAppBalance = (): AppBalance => ({
  appInfo: {
    name: 'Test Protocol',
    logoUrl: 'https://example.com/protocol.png',
    url: 'https://example.com',
  },
  balanceFiat: '1000',
  groups: [
    {
      name: 'Group A',
      items: [
        {
          key: 'position-1',
          type: 'deposit',
          name: 'Test Position',
          tokenInfo: {
            address: toBeHex('0x1', 20),
            decimals: 18,
            logoUri: 'https://example.com/token.png',
            name: 'Test Token',
            symbol: 'TEST',
            type: 'ERC20',
            chainId: CHAIN_ID,
            trusted: true,
          },
          balance: '1000000000000000000',
          balanceFiat: '1000',
          priceChangePercentage1d: '0.05',
        },
      ],
    },
  ],
})

describe('usePositions', () => {
  const mockChain = chainBuilder().with({ chainId: CHAIN_ID, features: [] }).build()
  const mockSafe = extendedSafeInfoBuilder()
    .with({
      address: { value: SAFE_ADDRESS },
      chainId: CHAIN_ID,
    })
    .build()

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()

    jest.spyOn(useChainId, 'default').mockReturnValue(CHAIN_ID)

    jest.spyOn(useSafeInfo, 'default').mockReturnValue({
      safe: mockSafe,
      safeAddress: SAFE_ADDRESS,
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })

    jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => {
      if (feature === FEATURES.PORTFOLIO_ENDPOINT) {
        return mockChain.features.includes(FEATURES.PORTFOLIO_ENDPOINT) ? true : false
      }
      return false
    })

    jest.spyOn(useIsPositionsFeatureEnabled, 'default').mockReturnValue(true)

    jest.spyOn(store, 'useAppSelector').mockImplementation((selector) => {
      if (selector === selectCurrency) {
        return 'USD'
      }
      return undefined
    })

    jest
      .spyOn(useBalances, 'default')
      .mockReturnValue({ balances: { items: [], fiatTotal: '' }, loaded: false, loading: false, error: undefined })

    jest.spyOn(positionsQueries, 'usePositionsGetPositionsV1Query').mockReturnValue({
      currentData: undefined,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    } as any)
  })

  describe('positions feature disabled', () => {
    it('should return undefined data when positions feature is disabled', async () => {
      jest.spyOn(useIsPositionsFeatureEnabled, 'default').mockReturnValue(false)

      const { result } = renderHook(() => usePositions())

      await waitFor(() => {
        expect(result.current.data).toBeUndefined()
      })

      expect(result.current.error).toBeUndefined()
      expect(result.current.isLoading).toBe(false)
    })

    it('should not call positions endpoint when feature is disabled', async () => {
      jest.spyOn(useIsPositionsFeatureEnabled, 'default').mockReturnValue(false)

      const positionsQuerySpy = jest.spyOn(positionsQueries, 'usePositionsGetPositionsV1Query')

      renderHook(() => usePositions())

      await waitFor(() => {
        expect(positionsQuerySpy).toHaveBeenCalled()
      })

      const callArgs = positionsQuerySpy.mock.calls[0]
      expect(callArgs[1]?.skip).toBe(true)
    })
  })

  describe('legacy positions endpoint', () => {
    beforeEach(() => {
      jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => {
        if (feature === FEATURES.PORTFOLIO_ENDPOINT) {
          return false
        }
        return false
      })
    })

    it('should return positions from legacy endpoint when portfolio endpoint is disabled', async () => {
      const mockProtocols = [createMockProtocol()]

      jest.spyOn(positionsQueries, 'usePositionsGetPositionsV1Query').mockReturnValue({
        currentData: mockProtocols,
        isLoading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => usePositions())

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      expect(result.current.data).toEqual(mockProtocols)
      expect(result.current.error).toBeUndefined()
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle loading state from legacy endpoint', async () => {
      jest.spyOn(positionsQueries, 'usePositionsGetPositionsV1Query').mockReturnValue({
        currentData: undefined,
        isLoading: true,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => usePositions())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.data).toBeUndefined()
    })

    it('should handle errors from legacy endpoint', async () => {
      const mockError = new Error('Legacy positions endpoint error')

      jest.spyOn(positionsQueries, 'usePositionsGetPositionsV1Query').mockReturnValue({
        currentData: undefined,
        isLoading: false,
        error: mockError,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => usePositions())

      await waitFor(() => {
        expect(result.current.error).toBeDefined()
      })

      expect(result.current.error).toBe(mockError)
      expect(result.current.data).toBeUndefined()
    })

    it('should skip query when safe address is missing', async () => {
      jest.spyOn(useSafeInfo, 'default').mockReturnValue({
        safe: mockSafe,
        safeAddress: '',
        safeLoaded: true,
        safeLoading: false,
        safeError: undefined,
      })

      const positionsQuerySpy = jest.spyOn(positionsQueries, 'usePositionsGetPositionsV1Query')

      renderHook(() => usePositions())

      await waitFor(() => {
        expect(positionsQuerySpy).toHaveBeenCalled()
      })

      const callArgs = positionsQuerySpy.mock.calls[0]
      expect(callArgs[1]?.skip).toBe(true)
    })

    it('should skip query when chain ID is missing', async () => {
      jest.spyOn(useChainId, 'default').mockReturnValue('')

      const positionsQuerySpy = jest.spyOn(positionsQueries, 'usePositionsGetPositionsV1Query')

      renderHook(() => usePositions())

      await waitFor(() => {
        expect(positionsQuerySpy).toHaveBeenCalled()
      })

      const callArgs = positionsQuerySpy.mock.calls[0]
      expect(callArgs[1]?.skip).toBe(true)
    })

    it('should skip query when currency is missing', async () => {
      jest.spyOn(store, 'useAppSelector').mockImplementation((selector) => {
        if (selector === selectCurrency) {
          return ''
        }
        return undefined
      })

      jest
        .spyOn(useBalances, 'default')
        .mockReturnValue({ balances: { items: [], fiatTotal: '' }, loaded: false, loading: false, error: undefined })

      const positionsQuerySpy = jest.spyOn(positionsQueries, 'usePositionsGetPositionsV1Query')

      renderHook(() => usePositions())

      await waitFor(() => {
        expect(positionsQuerySpy).toHaveBeenCalled()
      })

      const callArgs = positionsQuerySpy.mock.calls[0]
      expect(callArgs[1]?.skip).toBe(true)
    })
  })

  describe('portfolio endpoint', () => {
    beforeEach(() => {
      jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => {
        if (feature === FEATURES.PORTFOLIO_ENDPOINT) {
          return true
        }
        return false
      })
    })

    it('should return transformed positions from portfolio endpoint', async () => {
      const mockAppBalances = [createMockAppBalance()]

      jest.spyOn(store, 'useAppSelector').mockImplementation((selector) => {
        if (selector === selectCurrency) {
          return 'USD'
        }
        return undefined
      })

      jest.spyOn(useBalances, 'default').mockReturnValue({
        balances: { items: [], fiatTotal: '', positions: mockAppBalances },
        loaded: true,
        loading: false,
        error: undefined,
      })

      const { result } = renderHook(() => usePositions())

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      expect(result.current.data).toHaveLength(1)
      expect(result.current.data?.[0]?.protocol).toBe('Test Protocol')
      expect(result.current.data?.[0]?.protocol_metadata.name).toBe('Test Protocol')
      expect(result.current.data?.[0]?.protocol_metadata.icon.url).toBe('https://example.com/protocol.png')
      expect(result.current.data?.[0]?.fiatTotal).toBe('1000')
      expect(result.current.data?.[0]?.items).toHaveLength(1)
      expect(result.current.data?.[0]?.items[0]?.name).toBe('Group A')
      expect(result.current.data?.[0]?.items[0]?.items).toHaveLength(1)
      expect(result.current.data?.[0]?.items[0]?.items[0]?.fiatBalance).toBe('1000')
      expect(result.current.data?.[0]?.items[0]?.items[0]?.fiatBalance24hChange).toBe('0.05')
      expect(result.current.data?.[0]?.items[0]?.items[0]?.position_type).toBe('deposit')
      expect(result.current.error).toBeUndefined()
      expect(result.current.isLoading).toBe(false)
    })

    it('should transform AppBalance with missing logoUrl', async () => {
      const mockAppBalance: AppBalance = {
        ...createMockAppBalance(),
        appInfo: {
          name: 'Test Protocol B',
          logoUrl: undefined,
          url: 'https://example.com',
        },
      }

      jest.spyOn(store, 'useAppSelector').mockImplementation((selector) => {
        if (selector === selectCurrency) {
          return 'USD'
        }
        return undefined
      })

      jest.spyOn(useBalances, 'default').mockReturnValue({
        balances: { items: [], fiatTotal: '', positions: [mockAppBalance] },
        loaded: true,
        loading: false,
        error: undefined,
      })

      const { result } = renderHook(() => usePositions())

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      expect(result.current.data?.[0]?.protocol_metadata.icon.url).toBeNull()
    })

    it('should transform AppBalance with missing balanceFiat', async () => {
      const mockAppBalance: AppBalance = {
        ...createMockAppBalance(),
        groups: [
          {
            name: 'Group A',
            items: [
              {
                key: 'position-1',
                type: 'deposit',
                name: 'Test Position',
                tokenInfo: {
                  address: toBeHex('0x1', 20),
                  decimals: 18,
                  logoUri: 'https://example.com/token.png',
                  name: 'Test Token',
                  symbol: 'TEST',
                  type: 'ERC20',
                  chainId: CHAIN_ID,
                  trusted: true,
                },
                balance: '1000000000000000000',
                balanceFiat: undefined,
                priceChangePercentage1d: '0.05',
              },
            ],
          },
        ],
      }

      jest.spyOn(store, 'useAppSelector').mockImplementation((selector) => {
        if (selector === selectCurrency) {
          return 'USD'
        }
        return undefined
      })

      jest.spyOn(useBalances, 'default').mockReturnValue({
        balances: { items: [], fiatTotal: '', positions: [mockAppBalance] },
        loaded: true,
        loading: false,
        error: undefined,
      })

      const { result } = renderHook(() => usePositions())

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      expect(result.current.data?.[0]?.items[0]?.items[0]?.fiatBalance).toBe('0')
    })

    it('should transform AppBalance with missing logoUri', async () => {
      const mockAppBalance: AppBalance = {
        ...createMockAppBalance(),
        groups: [
          {
            name: 'Group A',
            items: [
              {
                key: 'position-1',
                type: 'deposit',
                name: 'Test Position',
                tokenInfo: {
                  address: toBeHex('0x1', 20),
                  decimals: 18,
                  logoUri: '',
                  name: 'Test Token',
                  symbol: 'TEST',
                  type: 'ERC20',
                  chainId: CHAIN_ID,
                  trusted: true,
                },
                balance: '1000000000000000000',
                balanceFiat: '1000',
                priceChangePercentage1d: '0.05',
              },
            ],
          },
        ],
      }

      jest.spyOn(store, 'useAppSelector').mockImplementation((selector) => {
        if (selector === selectCurrency) {
          return 'USD'
        }
        return undefined
      })

      jest.spyOn(useBalances, 'default').mockReturnValue({
        balances: { items: [], fiatTotal: '', positions: [mockAppBalance] },
        loaded: true,
        loading: false,
        error: undefined,
      })

      const { result } = renderHook(() => usePositions())

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      expect(result.current.data?.[0]?.items[0]?.items[0]?.tokenInfo.logoUri).toBe('')
    })

    it('should return undefined when portfolio positions are undefined', async () => {
      jest.spyOn(store, 'useAppSelector').mockImplementation((selector) => {
        if (selector === selectCurrency) {
          return 'USD'
        }
        return undefined
      })

      jest
        .spyOn(useBalances, 'default')
        .mockReturnValue({ balances: { items: [], fiatTotal: '' }, loaded: true, loading: false, error: undefined })

      const { result } = renderHook(() => usePositions())

      await waitFor(() => {
        expect(result.current.data).toBeUndefined()
      })
    })

    it('should return empty array when portfolio positions are empty array', async () => {
      jest.spyOn(store, 'useAppSelector').mockImplementation((selector) => {
        if (selector === selectCurrency) {
          return 'USD'
        }
        return undefined
      })

      jest.spyOn(useBalances, 'default').mockReturnValue({
        balances: { items: [], fiatTotal: '', positions: [] },
        loaded: true,
        loading: false,
        error: undefined,
      })

      const { result } = renderHook(() => usePositions())

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      expect(result.current.data).toEqual([])
    })

    it('should not call positions endpoint when portfolio endpoint is enabled', async () => {
      const mockAppBalances = [createMockAppBalance()]

      jest.spyOn(store, 'useAppSelector').mockImplementation((selector) => {
        if (selector === selectCurrency) {
          return 'USD'
        }
        return undefined
      })

      jest.spyOn(useBalances, 'default').mockReturnValue({
        balances: { items: [], fiatTotal: '', positions: mockAppBalances },
        loaded: true,
        loading: false,
        error: undefined,
      })

      const positionsQuerySpy = jest.spyOn(positionsQueries, 'usePositionsGetPositionsV1Query')

      renderHook(() => usePositions())

      await waitFor(() => {
        expect(positionsQuerySpy).toHaveBeenCalled()
      })

      const callArgs = positionsQuerySpy.mock.calls[0]
      expect(callArgs[1]?.skip).toBe(true)
    })

    it('should return error from balances state when portfolio endpoint fails', async () => {
      jest.spyOn(store, 'useAppSelector').mockImplementation((selector) => {
        if (selector === selectCurrency) {
          return 'USD'
        }
        return undefined
      })

      jest.spyOn(useBalances, 'default').mockReturnValue({
        balances: { items: [], fiatTotal: '' },
        loaded: false,
        loading: false,
        error: 'Portfolio endpoint error',
      })

      const { result } = renderHook(() => usePositions())

      await waitFor(() => {
        expect(result.current.error).toBeDefined()
      })

      expect(result.current.error).toBe('Portfolio endpoint error')
      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
    })

    it('should return loading state from balances state when portfolio endpoint is loading', async () => {
      jest.spyOn(store, 'useAppSelector').mockImplementation((selector) => {
        if (selector === selectCurrency) {
          return 'USD'
        }
        return undefined
      })

      jest
        .spyOn(useBalances, 'default')
        .mockReturnValue({ balances: { items: [], fiatTotal: '' }, loaded: false, loading: true, error: undefined })

      const { result } = renderHook(() => usePositions())

      expect(result.current.isLoading).toBe(true)
      expect(result.current.error).toBeUndefined()
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('multiple positions', () => {
    it('should handle multiple app balances', async () => {
      jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => {
        if (feature === FEATURES.PORTFOLIO_ENDPOINT) {
          return true
        }
        return false
      })

      const mockAppBalances: AppBalance[] = [
        createMockAppBalance(),
        {
          ...createMockAppBalance(),
          appInfo: {
            name: 'Test Protocol B',
            logoUrl: 'https://example.com/protocol-b.png',
            url: 'https://example.com',
          },
          balanceFiat: '2000',
        },
      ]

      jest.spyOn(store, 'useAppSelector').mockImplementation((selector) => {
        if (selector === selectCurrency) {
          return 'USD'
        }
        return undefined
      })

      jest.spyOn(useBalances, 'default').mockReturnValue({
        balances: { items: [], fiatTotal: '', positions: mockAppBalances },
        loaded: true,
        loading: false,
        error: undefined,
      })

      const { result } = renderHook(() => usePositions())

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      expect(result.current.data).toHaveLength(2)
      expect(result.current.data?.[0]?.protocol).toBe('Test Protocol')
      expect(result.current.data?.[1]?.protocol).toBe('Test Protocol B')
    })

    it('should handle app balance with multiple groups', async () => {
      jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => {
        if (feature === FEATURES.PORTFOLIO_ENDPOINT) {
          return true
        }
        return false
      })

      const mockAppBalance: AppBalance = {
        ...createMockAppBalance(),
        groups: [
          {
            name: 'Group A',
            items: [
              {
                key: 'position-1',
                type: 'deposit',
                name: 'Test Position A',
                tokenInfo: {
                  address: toBeHex('0x1', 20),
                  decimals: 18,
                  logoUri: 'https://example.com/token.png',
                  name: 'Test Token A',
                  symbol: 'TESTA',
                  type: 'ERC20',
                  chainId: CHAIN_ID,
                  trusted: true,
                },
                balance: '1000000000000000000',
                balanceFiat: '1000',
                priceChangePercentage1d: '0.05',
              },
            ],
          },
          {
            name: 'Group B',
            items: [
              {
                key: 'position-2',
                type: 'staked',
                name: 'Test Position B',
                tokenInfo: {
                  address: toBeHex('0x2', 20),
                  decimals: 18,
                  logoUri: 'https://example.com/token-b.png',
                  name: 'Test Token B',
                  symbol: 'TESTB',
                  type: 'NATIVE_TOKEN',
                  chainId: CHAIN_ID,
                  trusted: true,
                },
                balance: '2000000000000000000',
                balanceFiat: '2000',
                priceChangePercentage1d: '-0.02',
              },
            ],
          },
        ],
      }

      jest.spyOn(store, 'useAppSelector').mockImplementation((selector) => {
        if (selector === selectCurrency) {
          return 'USD'
        }
        return undefined
      })

      jest.spyOn(useBalances, 'default').mockReturnValue({
        balances: { items: [], fiatTotal: '', positions: [mockAppBalance] },
        loaded: true,
        loading: false,
        error: undefined,
      })

      const { result } = renderHook(() => usePositions())

      await waitFor(() => {
        expect(result.current.data).toBeDefined()
      })

      expect(result.current.data?.[0]?.items).toHaveLength(2)
      expect(result.current.data?.[0]?.items[0]?.name).toBe('Group A')
      expect(result.current.data?.[0]?.items[1]?.name).toBe('Group B')
    })
  })
})
