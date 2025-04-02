import * as store from '@/store'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { toBeHex } from 'ethers'
import useLoadBalances from '../loadables/useLoadBalances'
import { TokenType } from '@safe-global/safe-apps-sdk'
import * as useChainId from '@/hooks/useChainId'
import * as balancesQueries from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { FEATURES } from '@safe-global/utils/utils/chains'

const safeAddress = toBeHex('0x1234', 20)

const mockBalanceEUR = {
  fiatTotal: '1001',
  items: [
    {
      balance: '1001',
      fiatBalance: '1001',
      fiatConversion: '1',
      tokenInfo: {
        address: toBeHex('0x3', 20),
        decimals: 18,
        logoUri: '',
        name: 'sEuro',
        symbol: 'sEUR',
        type: TokenType.ERC20,
      },
    },
  ],
}

const mockBalanceUSD = {
  fiatTotal: '1002',
  items: [
    {
      balance: '1001',
      fiatBalance: '1001',
      fiatConversion: '1',
      tokenInfo: {
        address: toBeHex('0x3', 20),
        decimals: 18,
        logoUri: '',
        name: 'DAI',
        symbol: 'DAI',
        type: TokenType.ERC20,
      },
    },
  ],
}

const mockSafeInfo = {
  data: {
    ...defaultSafeInfo,
    address: { value: safeAddress },
    chainId: '5',
  },
  loading: false,
}

const mockBalanceDefaultList = { ...mockBalanceUSD, fiatTotal: '1003' }

const mockBalanceAllTokens = {
  fiatTotal: '1004',
  items: [
    {
      balance: '1',
      fiatBalance: '1000',
      fiatConversion: '1000',
      tokenInfo: {
        address: toBeHex('0x1', 20),
        decimals: 18,
        logoUri: '',
        name: 'First token',
        symbol: 'FIRST',
        type: TokenType.ERC20,
      },
    },
    {
      balance: '1',
      fiatBalance: '4',
      fiatConversion: '4',
      tokenInfo: {
        address: toBeHex('0x2', 20),
        decimals: 18,
        logoUri: '',
        name: 'Second token',
        symbol: '2ND',
        type: TokenType.ERC20,
      },
    },
  ],
}

describe('useLoadBalances', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    jest.spyOn(useChainId, 'useChainId').mockReturnValue('5')
  })

  test('without selected Safe', async () => {
    jest.spyOn(store, 'useAppSelector').mockImplementation((selector) =>
      selector({
        chains: {
          data: [
            {
              chainId: '5',
              features: [FEATURES.DEFAULT_TOKENLIST],
              chainName: 'Görli',
            } as any,
          ],
        },
        session: {
          lastChainId: '5',
        },
        safeInfo: {
          data: undefined,
          loading: false,
        },
        settings: {
          currency: 'USD',
          hiddenTokens: {},
          shortName: {
            copy: true,
            qr: true,
          },
          theme: {},
          tokenList: 'ALL',
        },
      } as store.RootState),
    )
    const { result } = renderHook(() => useLoadBalances())

    await waitFor(() => {
      expect(result.current[0]).toBeUndefined()
      expect(result.current[1]).toBeUndefined()
      expect(result.current[2]).toBeFalsy()
    })
  })

  test('pass correct currency and reload on currency change', async () => {
    jest
      .spyOn(balancesQueries, 'useBalancesGetBalancesV1Query')
      .mockImplementation(() => ({ data: mockBalanceEUR, isLoading: false, error: undefined, refetch: jest.fn() }))

    const mockSelector = jest.spyOn(store, 'useAppSelector').mockImplementation((selector) =>
      selector({
        chains: {
          data: [
            {
              chainId: '5',
              features: [FEATURES.DEFAULT_TOKENLIST],
              chainName: 'Görli',
            } as any,
          ],
        },
        safeInfo: mockSafeInfo,
        settings: {
          currency: 'EUR',
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
    const { result, rerender } = renderHook(() => useLoadBalances())

    await waitFor(async () => {
      expect(result.current[0]?.fiatTotal).toEqual(mockBalanceEUR.fiatTotal)
      expect(result.current[1]).toBeUndefined()
    })

    jest
      .spyOn(balancesQueries, 'useBalancesGetBalancesV1Query')
      .mockImplementation(() => ({ data: mockBalanceUSD, isLoading: false, error: undefined, refetch: jest.fn() }))

    mockSelector.mockImplementation((selector) =>
      selector({
        chains: {
          data: [
            {
              chainId: '5',
              features: [FEATURES.DEFAULT_TOKENLIST],
              chainName: 'Görli',
            } as any,
          ],
        },
        safeInfo: mockSafeInfo,
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

    act(() => rerender())

    await waitFor(async () => {
      expect(result.current[0]?.fiatTotal).toEqual(mockBalanceUSD.fiatTotal)
      expect(result.current[1]).toBeUndefined()
    })
  })

  test('only use default list if feature is enabled', async () => {
    jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockImplementation(() => ({
      data: mockBalanceAllTokens,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    }))

    jest.spyOn(store, 'useAppSelector').mockImplementation((selector) =>
      selector({
        chains: {
          data: [
            {
              chainId: '5',
              features: [],
              chainName: 'Görli',
            } as any,
          ],
        },
        safeInfo: mockSafeInfo,
        settings: {
          currency: 'EUR',
          hiddenTokens: {},
          shortName: {
            copy: true,
            qr: true,
          },
          theme: {},
          tokenList: TOKEN_LISTS.TRUSTED,
        },
      } as store.RootState),
    )
    const { result } = renderHook(() => useLoadBalances())

    await waitFor(async () => {
      expect(result.current[0]?.fiatTotal).toEqual(mockBalanceAllTokens.fiatTotal)
      expect(result.current[1]).toBeUndefined()
    })
  })

  test('use trusted filter for default list and reload on settings change', async () => {
    jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockImplementation(() => ({
      data: mockBalanceDefaultList,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    }))

    const mockSelector = jest.spyOn(store, 'useAppSelector').mockImplementation((selector) =>
      selector({
        chains: {
          data: [
            {
              chainId: '5',
              features: [FEATURES.DEFAULT_TOKENLIST],
              chainName: 'Görli',
            } as any,
          ],
        },
        session: {
          lastChainId: '5',
        },
        safeInfo: mockSafeInfo,
        settings: {
          currency: 'EUR',
          hiddenTokens: {},
          shortName: {
            copy: true,
            qr: true,
          },
          theme: {},
          tokenList: TOKEN_LISTS.TRUSTED,
        },
      } as store.RootState),
    )
    const { result, rerender } = renderHook(() => useLoadBalances())

    await waitFor(async () => {
      expect(result.current[0]?.fiatTotal).toEqual(mockBalanceDefaultList.fiatTotal)
      expect(result.current[1]).toBeUndefined()
    })

    jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockImplementation(() => ({
      data: mockBalanceAllTokens,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    }))

    mockSelector.mockImplementation((selector) =>
      selector({
        chains: {
          data: [
            {
              chainId: '5',
              features: [FEATURES.DEFAULT_TOKENLIST],
              chainName: 'Görli',
            } as any,
          ],
        },
        safeInfo: mockSafeInfo,
        settings: {
          currency: 'EUR',
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

    act(() => rerender())

    await waitFor(async () => {
      expect(result.current[0]?.fiatTotal).toEqual(mockBalanceAllTokens.fiatTotal)
      expect(result.current[1]).toBeUndefined()
    })
  })
})
