import { OperationType } from '@safe-global/types-kit'
import { skipToken } from '@reduxjs/toolkit/query'

import { renderHook } from '@/tests/test-utils'
import { useGasTokenCandidates } from '../useGasTokenCandidates'
import type { FeePreviewTx } from '../../public/hooks/useResolvedGasToken'
import * as useChainsModule from '@/hooks/useChains'
import * as useSafeInfoModule from '@/hooks/useSafeInfo'
import * as useTrustedTokenBalancesModule from '@/hooks/loadables/useTrustedTokenBalances'
import * as gatewayApi from '@/store/api/gateway'
import { chainBuilder } from '@/tests/builders/chains'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'

const ETH_ADDRESS = '0x0000000000000000000000000000000000000000'
// Mainnet gas tokens, as the Config Service serves them (checksummed)
const USDC_MAINNET = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const USDT_MAINNET = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
const DAI_MAINNET = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
// Held by the Safe but not a gas token
const UNLISTED_TOKEN = '0x1111111111111111111111111111111111111111'

const mainnetChain = chainBuilder()
  .with({ chainId: '1', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: 'eth.logo' } })
  .build()

const polygonChain = chainBuilder()
  .with({ chainId: '137', nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18, logoUri: 'pol.logo' } })
  .build()

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

const mockGasTokens = (tokens: Array<{ address: string; symbol: string }> | undefined) =>
  jest
    .spyOn(gatewayApi, 'useGetGasTokensQuery')
    .mockReturnValue({ data: tokens } as unknown as ReturnType<typeof gatewayApi.useGetGasTokensQuery>)

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
    mockGasTokens([
      { address: USDC_MAINNET, symbol: 'USDC' },
      { address: USDT_MAINNET, symbol: 'USDT' },
      { address: DAI_MAINNET, symbol: 'DAI' },
    ])
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

  it('excludes a held ERC-20 the fee service does not accept', () => {
    jest
      .spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances')
      .mockReturnValue(
        mockBalances([
          tokenBalance({ address: ETH_ADDRESS, symbol: 'ETH', type: 'NATIVE_TOKEN' }),
          tokenBalance({ address: USDC_MAINNET, symbol: 'USDC', decimals: 6 }),
          tokenBalance({ address: UNLISTED_TOKEN, symbol: 'UNLISTED' }),
        ]),
      )

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    expect(result.current.candidates.map((c) => c.symbol)).toEqual(['ETH', 'USDC'])
  })

  it('matches a gas token whatever the casing the balances use', () => {
    jest
      .spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances')
      .mockReturnValue(
        mockBalances([tokenBalance({ address: USDC_MAINNET.toLowerCase(), symbol: 'USDC', decimals: 6 })]),
      )

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    expect(result.current.candidates.map((c) => c.symbol)).toEqual(['USDC'])
  })

  it('puts the native token first, then the rest by fiat value', () => {
    jest.spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances').mockReturnValue(
      mockBalances([
        tokenBalance({ address: DAI_MAINNET, symbol: 'DAI', fiatBalance: '40' }),
        tokenBalance({ address: USDT_MAINNET, symbol: 'USDT', decimals: 6, fiatBalance: '900' }),
        // Worth the least, but the native token still leads
        tokenBalance({ address: ETH_ADDRESS, symbol: 'ETH', type: 'NATIVE_TOKEN', fiatBalance: '3' }),
        tokenBalance({ address: USDC_MAINNET, symbol: 'USDC', decimals: 6, fiatBalance: '120' }),
      ]),
    )

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    expect(result.current.candidates.map((c) => c.symbol)).toEqual(['ETH', 'USDT', 'USDC', 'DAI'])
    expect(result.current.defaultAddress).toBe(ETH_ADDRESS)
  })

  it('surfaces only the native token on a chain with no gas tokens', () => {
    mockGasTokens([])
    jest
      .spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances')
      .mockReturnValue(
        mockBalances([
          tokenBalance({ address: ETH_ADDRESS, symbol: 'ETH', type: 'NATIVE_TOKEN' }),
          tokenBalance({ address: USDC_MAINNET, symbol: 'USDC', decimals: 6 }),
        ]),
      )

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    expect(result.current.candidates.map((c) => c.symbol)).toEqual(['ETH'])
  })

  it('offers the native token while the gas token list is still loading', () => {
    mockGasTokens(undefined)
    jest
      .spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances')
      .mockReturnValue(
        mockBalances([
          tokenBalance({ address: ETH_ADDRESS, symbol: 'ETH', type: 'NATIVE_TOKEN' }),
          tokenBalance({ address: USDC_MAINNET, symbol: 'USDC', decimals: 6 }),
        ]),
      )

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    expect(result.current.candidates.map((c) => c.symbol)).toEqual(['ETH'])
  })

  it('skips the gas token request until the chain is known', () => {
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(undefined)
    const query = mockGasTokens([])
    jest
      .spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances')
      .mockReturnValue(mockBalances([tokenBalance({ address: ETH_ADDRESS, symbol: 'ETH', type: 'NATIVE_TOKEN' })]))

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    expect(query.mock.calls.at(-1)?.[0]).toBe(skipToken)
    expect(result.current.candidates).toEqual([])
  })

  it('keeps the native token even when its address is non-ZERO (e.g. Polygon POL precompile)', () => {
    // Some chains return the native token with type 'NATIVE_TOKEN' but a chain-specific address
    // (Polygon's precompile is 0x…1010). The filter must trust `type` and not require ZERO_ADDRESS.
    const POLYGON_NATIVE_PRECOMPILE = '0x0000000000000000000000000000000000001010'
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(polygonChain)
    mockGasTokens([])
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
