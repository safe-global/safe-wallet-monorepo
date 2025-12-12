import { TokenType } from '@safe-global/store/gateway/types'
import * as store from '@/store'
import * as useBalancesHooks from '@/hooks/useBalances'
import * as useChains from '@/hooks/useChains'
import { renderHook } from '@/tests/test-utils'
import { toBeHex } from 'ethers'
import { useVisibleBalances, useHideDust } from '../useVisibleBalances'
import { type Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { DUST_THRESHOLD } from '@/config/constants'
import { FEATURES } from '@safe-global/utils/utils/chains'

describe('useHideDust', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('returns true when PORTFOLIO_ENDPOINT feature is enabled and hideDust is undefined', () => {
    jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => {
      return feature === FEATURES.PORTFOLIO_ENDPOINT
    })

    jest.spyOn(store, 'useAppSelector').mockImplementation((selector) =>
      selector({
        settings: {
          hideDust: undefined,
        },
      } as unknown as store.RootState),
    )

    const { result } = renderHook(() => useHideDust())
    expect(result.current).toBe(true)
  })

  test('returns false when PORTFOLIO_ENDPOINT feature is disabled and hideDust is undefined', () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)

    jest.spyOn(store, 'useAppSelector').mockImplementation((selector) =>
      selector({
        settings: {
          hideDust: undefined,
        },
      } as unknown as store.RootState),
    )

    const { result } = renderHook(() => useHideDust())
    expect(result.current).toBe(false)
  })

  test('returns user setting when hideDust is explicitly set to true', () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)

    jest.spyOn(store, 'useAppSelector').mockImplementation((selector) =>
      selector({
        settings: {
          hideDust: true,
        },
      } as unknown as store.RootState),
    )

    const { result } = renderHook(() => useHideDust())
    expect(result.current).toBe(true)
  })

  test('returns user setting when hideDust is explicitly set to false', () => {
    jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => {
      return feature === FEATURES.PORTFOLIO_ENDPOINT
    })

    jest.spyOn(store, 'useAppSelector').mockImplementation((selector) =>
      selector({
        settings: {
          hideDust: false,
        },
      } as unknown as store.RootState),
    )

    const { result } = renderHook(() => useHideDust())
    expect(result.current).toBe(false)
  })
})

describe('useVisibleBalances', () => {
  const hiddenTokenAddress = toBeHex('0x2', 20)
  const visibleTokenAddress = toBeHex('0x3', 20)
  const dustTokenAddress = toBeHex('0x4', 20)

  beforeEach(() => {
    jest.clearAllMocks()
    // Default mock for useHasFeature - can be overridden in individual tests
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)
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

  test('filters dust tokens when hideDust is enabled (explicit setting)', () => {
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

  test('shows dust tokens when hideDust is disabled (explicit setting)', () => {
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

  test('filters dust tokens by default when PORTFOLIO_ENDPOINT feature is enabled', () => {
    jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => {
      return feature === FEATURES.PORTFOLIO_ENDPOINT
    })

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
          hideDust: undefined, // Not explicitly set - should use feature flag default
        },
        chains: { data: [], error: undefined, loading: false, loaded: true },
      } as unknown as store.RootState),
    )

    const { result } = renderHook(() => useVisibleBalances())

    // Should filter dust because PORTFOLIO_ENDPOINT is enabled
    expect(result.current.balances.items).toHaveLength(1)
    expect(result.current.balances.items[0].tokenInfo.symbol).toEqual('VT')
  })

  test('shows dust tokens by default when PORTFOLIO_ENDPOINT feature is disabled', () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)

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
          hideDust: undefined, // Not explicitly set - should use feature flag default
        },
        chains: { data: [], error: undefined, loading: false, loaded: true },
      } as unknown as store.RootState),
    )

    const { result } = renderHook(() => useVisibleBalances())

    // Should show dust because PORTFOLIO_ENDPOINT is disabled
    expect(result.current.balances.items).toHaveLength(2)
  })
})
