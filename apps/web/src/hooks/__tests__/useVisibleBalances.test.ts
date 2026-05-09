import { TokenType } from '@safe-global/store/gateway/types'
import * as store from '@/store'
import * as useBalancesHooks from '@/hooks/useBalances'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import { renderHook } from '@/tests/test-utils'
import { toBeHex } from 'ethers'
import { useVisibleBalances } from '../useVisibleBalances'
import { type Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { DUST_THRESHOLD } from '@/config/constants'

describe('useVisibleBalances', () => {
  const hiddenTokenAddress = toBeHex('0x2', 20)
  const visibleTokenAddress = toBeHex('0x3', 20)
  const dustTokenAddress = toBeHex('0x4', 20)

  beforeEach(() => {
    jest.spyOn(useSafeInfoHook, 'default').mockReturnValue({
      safe: { deployed: true } as any,
      safeAddress: toBeHex('0x1', 20),
      safeLoaded: true,
      safeLoading: false,
      safeError: undefined,
    })
  })

  test('empty balance', () => {
    const balance: Balances = {
      fiatTotal: '0',
      items: [],
    }
    jest.spyOn(useBalancesHooks, 'default').mockImplementation(() => ({
      balances: balance,
      error: undefined,
      loading: false,
      loaded: true,
    }))

    jest.spyOn(store, 'useAppSelector').mockImplementation((selector) =>
      selector({
        settings: {
          currency: 'USD',
          shortName: {
            copy: true,
            qr: true,
            show: true,
          },
          theme: {
            darkMode: false,
          },
          hiddenTokens: { ['4']: [hiddenTokenAddress] },
        },
        chains: { data: [], error: undefined, loading: false, loaded: true },
      } as unknown as store.RootState),
    )

    const { result } = renderHook(() => useVisibleBalances())

    expect(result.current.balances.fiatTotal).toEqual('0')
    expect(result.current.balances.items).toHaveLength(0)
  })

  test('return only visible balance', () => {
    const balance: Balances = {
      fiatTotal: '100',
      items: [
        {
          balance: '40',
          fiatBalance: '40',
          fiatConversion: '1',
          tokenInfo: {
            address: hiddenTokenAddress,
            decimals: 18,
            logoUri: '',
            name: 'Hidden Token',
            symbol: 'HT',
            type: TokenType.ERC20,
          },
        },
        {
          balance: '60',
          fiatBalance: '60',
          fiatConversion: '1',
          tokenInfo: {
            address: visibleTokenAddress,
            decimals: 18,
            logoUri: '',
            name: 'Visible Token',
            symbol: 'VT',
            type: TokenType.ERC20,
          },
        },
      ],
    }

    jest.spyOn(useBalancesHooks, 'default').mockImplementation(() => ({
      balances: balance,
      error: undefined,
      loading: false,
      loaded: true,
    }))

    jest.spyOn(store, 'useAppSelector').mockImplementation((selector) =>
      selector({
        settings: {
          currency: 'USD',
          shortName: {
            copy: true,
            qr: true,
            show: true,
          },
          theme: {
            darkMode: false,
          },
          hiddenTokens: { ['4']: [hiddenTokenAddress] },
        },
        chains: { data: [], error: undefined, loading: false, loaded: true },
      } as unknown as store.RootState),
    )

    const { result } = renderHook(() => useVisibleBalances())

    expect(result.current.balances.fiatTotal).toEqual('60')
    expect(result.current.balances.items).toHaveLength(1)
  })

  test('computation works for high precision numbers', () => {
    const balance: Balances = {
      fiatTotal: '200.01234567890123456789',
      items: [
        {
          balance: '100',
          fiatBalance: '100',
          fiatConversion: '1',
          tokenInfo: {
            address: hiddenTokenAddress,
            decimals: 18,
            logoUri: '',
            name: 'Hidden Token',
            symbol: 'HT',
            type: TokenType.ERC20,
          },
        },
        {
          balance: '60.0123456789',
          fiatBalance: '60.0123456789',
          fiatConversion: '1',
          tokenInfo: {
            address: visibleTokenAddress,
            decimals: 18,
            logoUri: '',
            name: 'Visible Token',
            symbol: 'VT',
            type: TokenType.ERC20,
          },
        },
        {
          balance: '40.00000000000123456789',
          fiatBalance: '40.00000000000123456789',
          fiatConversion: '1',
          tokenInfo: {
            address: visibleTokenAddress,
            decimals: 18,
            logoUri: '',
            name: 'Visible Token',
            symbol: 'VT',
            type: TokenType.ERC20,
          },
        },
      ],
    }

    jest.spyOn(useBalancesHooks, 'default').mockImplementation(() => ({
      balances: balance,
      error: undefined,
      loading: false,
      loaded: true,
    }))

    jest.spyOn(store, 'useAppSelector').mockImplementation((selector) =>
      selector({
        balances: { data: balance, error: undefined, loading: false, loaded: true },
        settings: {
          currency: 'USD',
          shortName: {
            copy: true,
            qr: true,
            show: true,
          },
          theme: {
            darkMode: false,
          },
          hiddenTokens: { ['4']: [hiddenTokenAddress] },
        },
        chains: { data: [], error: undefined, loading: false, loaded: true },
      } as unknown as store.RootState),
    )

    const { result } = renderHook(() => useVisibleBalances())

    expect(result.current.balances.fiatTotal).toEqual('100.012345678901234567')
    expect(result.current.balances.items).toHaveLength(2)
  })

  test('computation works for high USD values', () => {
    const balance: Balances = {
      // Current total USD value of all Safes on mainnet * 1 million
      fiatTotal: '28303710905000100.0123456789',
      items: [
        {
          balance: '100',
          fiatBalance: '100',
          fiatConversion: '1',
          tokenInfo: {
            address: hiddenTokenAddress,
            decimals: 18,
            logoUri: '',
            name: 'Hidden Token',
            symbol: 'HT',
            type: TokenType.ERC20,
          },
        },
        {
          balance: '28303710905000000.0123456789',
          fiatBalance: '28303710905000000.0123456789',
          fiatConversion: '1',
          tokenInfo: {
            address: visibleTokenAddress,
            decimals: 18,
            logoUri: '',
            name: 'USDC',
            symbol: 'USDC',
            type: TokenType.ERC20,
          },
        },
      ],
    }

    jest.spyOn(useBalancesHooks, 'default').mockImplementation(() => ({
      balances: balance,
      error: undefined,
      loading: false,
      loaded: true,
    }))

    jest.spyOn(store, 'useAppSelector').mockImplementation((selector) =>
      selector({
        settings: {
          currency: 'USD',
          shortName: {
            copy: true,
            qr: true,
            show: true,
          },
          theme: {
            darkMode: false,
          },
          hiddenTokens: { ['4']: [hiddenTokenAddress] },
        },
        chains: { data: [], error: undefined, loading: false, loaded: true },
      } as unknown as store.RootState),
    )

    const { result } = renderHook(() => useVisibleBalances())

    expect(result.current.balances.fiatTotal).toEqual('28303710905000000.0123456789')
    expect(result.current.balances.items).toHaveLength(1)
  })

  test('filters dust tokens when hideDust is enabled', () => {
    const dustValue = (DUST_THRESHOLD / 2).toString()
    const balance: Balances = {
      fiatTotal: '100',
      items: [
        {
          balance: '1000000',
          fiatBalance: dustValue,
          fiatConversion: '0.0000001',
          tokenInfo: {
            address: dustTokenAddress,
            decimals: 18,
            logoUri: '',
            name: 'Dust Token',
            symbol: 'DUST',
            type: TokenType.ERC20,
          },
        },
        {
          balance: '100',
          fiatBalance: '100',
          fiatConversion: '1',
          tokenInfo: {
            address: visibleTokenAddress,
            decimals: 18,
            logoUri: '',
            name: 'Visible Token',
            symbol: 'VT',
            type: TokenType.ERC20,
          },
        },
      ],
    }

    jest.spyOn(useBalancesHooks, 'default').mockImplementation(() => ({
      balances: balance,
      error: undefined,
      loading: false,
      loaded: true,
    }))

    jest.spyOn(store, 'useAppSelector').mockImplementation((selector) =>
      selector({
        settings: {
          currency: 'USD',
          shortName: { copy: true, qr: true, show: true },
          theme: { darkMode: false },
          hiddenTokens: { ['4']: [] },
          hideDust: true,
        },
        chains: { data: [], error: undefined, loading: false, loaded: true },
      } as unknown as store.RootState),
    )

    const { result } = renderHook(() => useVisibleBalances())

    expect(result.current.balances.items).toHaveLength(1)
    expect(result.current.balances.items[0].tokenInfo.symbol).toEqual('VT')
  })

  test('shows dust tokens when hideDust is disabled', () => {
    const dustValue = (DUST_THRESHOLD / 2).toString()
    const balance: Balances = {
      fiatTotal: '100',
      items: [
        {
          balance: '1000000',
          fiatBalance: dustValue,
          fiatConversion: '0.0000001',
          tokenInfo: {
            address: dustTokenAddress,
            decimals: 18,
            logoUri: '',
            name: 'Dust Token',
            symbol: 'DUST',
            type: TokenType.ERC20,
          },
        },
        {
          balance: '100',
          fiatBalance: '100',
          fiatConversion: '1',
          tokenInfo: {
            address: visibleTokenAddress,
            decimals: 18,
            logoUri: '',
            name: 'Visible Token',
            symbol: 'VT',
            type: TokenType.ERC20,
          },
        },
      ],
    }

    jest.spyOn(useBalancesHooks, 'default').mockImplementation(() => ({
      balances: balance,
      error: undefined,
      loading: false,
      loaded: true,
    }))

    jest.spyOn(store, 'useAppSelector').mockImplementation((selector) =>
      selector({
        settings: {
          currency: 'USD',
          shortName: { copy: true, qr: true, show: true },
          theme: { darkMode: false },
          hiddenTokens: { ['4']: [] },
          hideDust: false,
        },
        chains: { data: [], error: undefined, loading: false, loaded: true },
      } as unknown as store.RootState),
    )

    const { result } = renderHook(() => useVisibleBalances())

    expect(result.current.balances.items).toHaveLength(2)
  })
})
