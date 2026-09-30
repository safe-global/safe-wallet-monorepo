import { OperationType } from '@safe-global/types-kit'

import { renderHook } from '@/tests/test-utils'
import { useGasTokenCandidates } from '../useGasTokenCandidates'
import type { FeePreviewTx } from '../useResolvedGasToken'
import * as useChainsModule from '@/hooks/useChains'
import * as useSafeInfoModule from '@/hooks/useSafeInfo'
import * as useTrustedTokenBalancesModule from '@/hooks/loadables/useTrustedTokenBalances'
import { chainBuilder } from '@/tests/builders/chains'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'

const ETH_ADDRESS = '0x0000000000000000000000000000000000000000'
// Mainnet allowlisted addresses (per PLA-1412)
const USDC_MAINNET = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDT_MAINNET = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
const DAI_MAINNET = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const WETH_MAINNET = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const PYUSD_MAINNET = '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8'
// Arbitrum bridged USDC.e — explicitly excluded
const USDC_E_ARBITRUM = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'
const USDC_NATIVE_ARBITRUM = '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
// Random non-allowlisted token
const RANDOM_TOKEN = '0x5aFE3855358E112B5647B952709E6165e1c1eEEe'

const mainnetChain = chainBuilder()
  .with({ chainId: '1', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: 'eth.logo' } })
  .build()

const arbitrumChain = chainBuilder()
  .with({ chainId: '42161', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: 'eth.logo' } })
  .build()

const polygonChain = chainBuilder()
  .with({ chainId: '137', nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18, logoUri: 'pol.logo' } })
  .build()

// Optimism is intentionally not in the allowlist — used to verify the "native only" fallback.
const optimismChain = chainBuilder()
  .with({ chainId: '10', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: 'op.logo' } })
  .build()

const POLYGON_USDC = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
const POLYGON_DAI = '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'
const POLYGON_USDC_E = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'

const mockSafe = extendedSafeInfoBuilder().with({ threshold: 1 }).build()

const tx: FeePreviewTx = {
  to: '0x38D48FaDa993b749691E93e4E62259c488bCb766',
  value: '100000000000000',
  data: '0x',
  operation: OperationType.Call,
}

const tokenBalance = (overrides: {
  address: string
  symbol: string
  type?: 'NATIVE_TOKEN' | 'ERC20'
  decimals?: number
  balance?: string
  fiatBalance?: string
}) => ({
  balance: overrides.balance ?? '1000000000000000000',
  fiatBalance: overrides.fiatBalance ?? '100',
  fiatConversion: '1',
  tokenInfo: {
    address: overrides.address,
    decimals: overrides.decimals ?? 18,
    logoUri: `https://${overrides.symbol.toLowerCase()}.logo`,
    name: overrides.symbol,
    symbol: overrides.symbol,
    type: overrides.type ?? 'ERC20',
  },
})

const mockBalances = (items: unknown[]): ReturnType<typeof useTrustedTokenBalancesModule.useTrustedTokenBalances> =>
  [{ fiatTotal: '0', items: items as never }, undefined, false] as never

describe('useGasTokenCandidates', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(mainnetChain)
    jest.spyOn(useSafeInfoModule, 'default').mockReturnValue({
      safe: mockSafe,
      safeAddress: mockSafe.address.value,
      safeLoaded: true,
      safeLoading: false,
    })
  })

  it('returns empty candidates when tx is undefined', () => {
    jest
      .spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances')
      .mockReturnValue(mockBalances([tokenBalance({ address: ETH_ADDRESS, symbol: 'ETH', type: 'NATIVE_TOKEN' })]))

    const { result } = renderHook(() => useGasTokenCandidates(undefined))

    expect(result.current.candidates).toEqual([])
    expect(result.current.defaultAddress).toBeUndefined()
  })

  it('returns empty candidates when Safe holds no tokens', () => {
    jest.spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances').mockReturnValue(mockBalances([]))

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    expect(result.current.candidates).toEqual([])
  })

  it('excludes tokens with zero balance', () => {
    jest
      .spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances')
      .mockReturnValue(
        mockBalances([
          tokenBalance({ address: ETH_ADDRESS, symbol: 'ETH', type: 'NATIVE_TOKEN' }),
          tokenBalance({ address: USDC_MAINNET, symbol: 'USDC', decimals: 6, balance: '0' }),
        ]),
      )

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    expect(result.current.candidates.map((c) => c.symbol)).toEqual(['ETH'])
  })

  it('excludes ERC-20 tokens not in the chain allowlist', () => {
    jest
      .spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances')
      .mockReturnValue(
        mockBalances([
          tokenBalance({ address: ETH_ADDRESS, symbol: 'ETH', type: 'NATIVE_TOKEN' }),
          tokenBalance({ address: USDC_MAINNET, symbol: 'USDC', decimals: 6 }),
          tokenBalance({ address: RANDOM_TOKEN, symbol: 'RANDOM' }),
        ]),
      )

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    expect(result.current.candidates.map((c) => c.symbol)).toEqual(['ETH', 'USDC'])
  })

  it('orders candidates by allowlist priority (native → USDC → USDT → DAI → WETH → PYUSD)', () => {
    jest.spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances').mockReturnValue(
      mockBalances([
        // Intentionally shuffled — order should come from the allowlist, not the input.
        tokenBalance({ address: PYUSD_MAINNET, symbol: 'PYUSD', decimals: 6 }),
        tokenBalance({ address: WETH_MAINNET, symbol: 'WETH' }),
        tokenBalance({ address: DAI_MAINNET, symbol: 'DAI' }),
        tokenBalance({ address: ETH_ADDRESS, symbol: 'ETH', type: 'NATIVE_TOKEN' }),
        tokenBalance({ address: USDT_MAINNET, symbol: 'USDT', decimals: 6 }),
        tokenBalance({ address: USDC_MAINNET, symbol: 'USDC', decimals: 6 }),
      ]),
    )

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    expect(result.current.candidates.map((c) => c.symbol)).toEqual(['ETH', 'USDC', 'USDT', 'DAI', 'WETH', 'PYUSD'])
    expect(result.current.defaultAddress).toBe(ETH_ADDRESS)
  })

  it('explicitly excludes bridged USDC.e on Arbitrum (only native USDC allowlisted)', () => {
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(arbitrumChain)
    jest
      .spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances')
      .mockReturnValue(
        mockBalances([
          tokenBalance({ address: ETH_ADDRESS, symbol: 'ETH', type: 'NATIVE_TOKEN' }),
          tokenBalance({ address: USDC_NATIVE_ARBITRUM, symbol: 'USDC', decimals: 6 }),
          tokenBalance({ address: USDC_E_ARBITRUM, symbol: 'USDC.e', decimals: 6 }),
        ]),
      )

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    const addresses = result.current.candidates.map((c) => c.address.toLowerCase())
    expect(addresses).toContain(USDC_NATIVE_ARBITRUM.toLowerCase())
    expect(addresses).not.toContain(USDC_E_ARBITRUM.toLowerCase())
  })

  it('on chains absent from the allowlist, surfaces only the native gas token', () => {
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(optimismChain)
    jest.spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances').mockReturnValue(
      mockBalances([
        tokenBalance({ address: ETH_ADDRESS, symbol: 'ETH', type: 'NATIVE_TOKEN' }),
        // ERC-20 with a balance — must be filtered out because Optimism has no allowlist entry.
        tokenBalance({ address: USDC_MAINNET, symbol: 'USDC', decimals: 6 }),
      ]),
    )

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    expect(result.current.candidates.map((c) => c.symbol)).toEqual(['ETH'])
    expect(result.current.defaultAddress).toBe(ETH_ADDRESS)
  })

  it('Polygon allowlist surfaces POL + USDC + DAI and excludes bridged USDC.e', () => {
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(polygonChain)
    jest.spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances').mockReturnValue(
      mockBalances([
        tokenBalance({ address: ETH_ADDRESS, symbol: 'POL', type: 'NATIVE_TOKEN' }),
        tokenBalance({ address: POLYGON_USDC, symbol: 'USDC', decimals: 6 }),
        tokenBalance({ address: POLYGON_DAI, symbol: 'DAI' }),
        // Bridged — must be excluded
        tokenBalance({ address: POLYGON_USDC_E, symbol: 'USDC.e', decimals: 6 }),
      ]),
    )

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    expect(result.current.candidates.map((c) => c.symbol)).toEqual(['POL', 'USDC', 'DAI'])
    const addresses = result.current.candidates.map((c) => c.address.toLowerCase())
    expect(addresses).not.toContain(POLYGON_USDC_E.toLowerCase())
  })

  it('keeps the native token even when its address is non-ZERO (e.g. Polygon POL precompile)', () => {
    // Some chains return the native token with type 'NATIVE_TOKEN' but a chain-specific address
    // (Polygon's precompile is 0x…1010). The filter must trust `type` and not require ZERO_ADDRESS.
    const POLYGON_NATIVE_PRECOMPILE = '0x0000000000000000000000000000000000001010'
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(polygonChain)
    jest
      .spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances')
      .mockReturnValue(
        mockBalances([tokenBalance({ address: POLYGON_NATIVE_PRECOMPILE, symbol: 'POL', type: 'NATIVE_TOKEN' })]),
      )

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    expect(result.current.candidates.map((c) => c.symbol)).toEqual(['POL'])
    expect(result.current.defaultAddress).toBe(POLYGON_NATIVE_PRECOMPILE)
  })

  it('uses chain config logoUri for the native token (avoids broken TX Service URL)', () => {
    jest
      .spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances')
      .mockReturnValue(mockBalances([tokenBalance({ address: ETH_ADDRESS, symbol: 'ETH', type: 'NATIVE_TOKEN' })]))

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    expect(result.current.candidates[0].logoUri).toBe('eth.logo') // from mainnetChain.nativeCurrency.logoUri
  })

  it('resolves candidates synchronously (no /fees/preview probes)', () => {
    jest
      .spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances')
      .mockReturnValue(mockBalances([tokenBalance({ address: ETH_ADDRESS, symbol: 'ETH', type: 'NATIVE_TOKEN' })]))

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    expect(result.current.candidates).toHaveLength(1)
    expect(result.current.defaultAddress).toBe(ETH_ADDRESS)
  })
})
