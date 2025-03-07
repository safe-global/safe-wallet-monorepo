import * as useIsSafenetEnabled from '@/features/safenet/hooks/useIsSafenetEnabled'
import * as useChainId from '@/hooks/useChainId'
import * as store from '@/store'
import { defaultSafeInfo } from '@/store/safeInfoSlice'
import * as safenetStore from '@/store/safenet'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { FEATURES } from '@/utils/chains'
import { TokenType } from '@safe-global/safe-apps-sdk'
import * as balancesQueries from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { toBeHex } from 'ethers'
import useLoadBalances from '../loadables/useLoadBalances'

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

const mockSafenetBalance = {
  USDC: {
    breakdown: {
      '11155420': {
        address: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
        allowances: '0',
        balance: '1000000', // 1 USDC
        total: '1000000',
      },
      '11155111': {
        address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        allowances: '0',
        balance: '2000000', // 2 USDC
        total: '2000000',
      },
    },
    total: '3000000', // 3 USDC
  },
}

describe('useLoadBalances', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    jest.spyOn(useChainId, 'useChainId').mockReturnValue('11155111')
    jest.spyOn(safenetStore, 'useGetSafenetConfigQuery').mockReturnValue({
      data: {
        chains: [84532, 11155420],
        guards: {
          '84532': '0x865544E0599589BA604b0449858695937d571382',
          '11155111': '0x865544E0599589BA604b0449858695937d571382',
          '11155420': '0x865544E0599589BA604b0449858695937d571382',
        },
        tokens: {
          USDC: {
            '84532': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
            '11155111': '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
            '11155420': '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
          },
          DAI: {
            '84532': '0xE6F6e27c0BF1a4841E3F09d03D7D31Da8eAd0a27',
            '11155111': '0xB4F1737Af37711e9A5890D9510c9bB60e170CB0D',
            '11155420': '0x0091f4e75a03C11cB9be8E3717219005eb780D89',
          },
        },
      },
      isLoading: false,
      error: undefined,
      isSuccess: true,
      refetch: jest.fn(),
    })
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

  test('should merge Safenet balances when Safenet is enabled', async () => {
    jest.spyOn(balancesQueries, 'useBalancesGetBalancesV1Query').mockReturnValue({
      data: mockBalanceUSD,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    })

    jest.spyOn(useIsSafenetEnabled, 'useIsSafenetEnabled').mockReturnValue(true)

    jest.spyOn(safenetStore, 'useGetSafenetBalanceQuery').mockReturnValue({
      data: mockSafenetBalance,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    })

    jest.spyOn(store, 'useAppSelector').mockImplementation((selector) =>
      selector({
        chains: {
          data: [
            {
              chainId: '11155111',
              features: [FEATURES.DEFAULT_TOKENLIST],
              chainName: 'Sepolia',
            } as any,
          ],
        },
        safeInfo: mockSafeInfo,
        settings: {
          currency: 'usd',
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

    const { result } = renderHook(() => useLoadBalances())

    await waitFor(() => {
      expect(result.current[0]).toBeDefined()
      expect(result.current[1]).toBeUndefined()

      const usdcItem = result.current[0]?.items.find((item) => item.tokenInfo.symbol === 'USDC')

      // Safenet USDC total balance
      expect(Number(usdcItem?.balance)).toBe(
        Number(mockSafenetBalance.USDC.breakdown['11155111'].total) +
          Number(mockSafenetBalance.USDC.breakdown['11155420'].total),
      )
      // Safenet USDC breakdownb balances
      expect(usdcItem?.safenetBalance?.filter((balance) => balance.chainId === '11155111')[0].balance).toBe(
        mockSafenetBalance.USDC.breakdown['11155111'].total,
      )
      expect(usdcItem?.safenetBalance?.filter((balance) => balance.chainId === '11155420')[0].balance).toBe(
        mockSafenetBalance.USDC.breakdown['11155420'].total,
      )
    })
  })
})
