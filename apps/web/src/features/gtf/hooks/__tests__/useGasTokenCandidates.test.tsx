import { act, waitFor } from '@testing-library/react'
import { OperationType } from '@safe-global/types-kit'

import { renderHook } from '@/tests/test-utils'
import { useGasTokenCandidates } from '../useGasTokenCandidates'
import type { FeePreviewTx } from '../useResolvedGasToken'
import * as useChainsModule from '@/hooks/useChains'
import * as useSafeInfoModule from '@/hooks/useSafeInfo'
import * as useTrustedTokenBalancesModule from '@/hooks/loadables/useTrustedTokenBalances'
import { gatewayApi } from '@/store/api/gateway'
import { chainBuilder } from '@/tests/builders/chains'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'

const ETH_ADDRESS = '0x0000000000000000000000000000000000000000'
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const SAFE_TOKEN_ADDRESS = '0x5aFE3855358E112B5647B952709E6165e1c1eEEe'
const UNPRICED_ADDRESS = '0x58e48F88bF943367f05F31164d2943FF4008EEc6'

const mockChain = chainBuilder()
  .with({ chainId: '1', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: '' } })
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

describe('useGasTokenCandidates', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(mockChain)
    jest.spyOn(useSafeInfoModule, 'default').mockReturnValue({
      safe: mockSafe,
      safeAddress: mockSafe.address.value,
      safeLoaded: true,
      safeLoading: false,
    })
  })

  it('returns empty candidates and probing=false when tx is undefined', () => {
    jest
      .spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances')
      .mockReturnValue(mockBalances([tokenBalance({ address: ETH_ADDRESS, symbol: 'ETH', type: 'NATIVE_TOKEN' })]))

    const { result } = renderHook(() => useGasTokenCandidates(undefined))

    expect(result.current.candidates).toEqual([])
    expect(result.current.probing).toBe(false)
    expect(result.current.defaultAddress).toBeUndefined()
  })

  it('returns empty candidates when Safe holds no tokens', () => {
    jest.spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances').mockReturnValue(mockBalances([]))

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    expect(result.current.candidates).toEqual([])
    expect(result.current.probing).toBe(false)
  })

  it('excludes tokens with zero balance', async () => {
    jest
      .spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances')
      .mockReturnValue(
        mockBalances([
          tokenBalance({ address: ETH_ADDRESS, symbol: 'ETH', type: 'NATIVE_TOKEN' }),
          tokenBalance({ address: USDC_ADDRESS, symbol: 'USDC', decimals: 6, balance: '0' }),
        ]),
      )
    jest.spyOn(gatewayApi.endpoints.getGtfFeePreview, 'initiate').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      () => (() => ({ unwrap: () => Promise.resolve({ txData: {} }), unsubscribe: jest.fn() })) as any,
    )

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    await waitFor(() => expect(result.current.probing).toBe(false))
    expect(result.current.candidates.map((c) => c.symbol)).toEqual(['ETH'])
  })

  it('includes tokens whose probe succeeds, excludes those whose probe errors', async () => {
    jest
      .spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances')
      .mockReturnValue(
        mockBalances([
          tokenBalance({ address: ETH_ADDRESS, symbol: 'ETH', type: 'NATIVE_TOKEN' }),
          tokenBalance({ address: UNPRICED_ADDRESS, symbol: 'TEST' }),
        ]),
      )

    const initiateSpy = jest
      .spyOn(gatewayApi.endpoints.getGtfFeePreview, 'initiate')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(((arg: any) => () => ({
        unwrap:
          arg.tx.gasToken === UNPRICED_ADDRESS
            ? () => Promise.reject(new Error('no price'))
            : () => Promise.resolve({ txData: {} }),
        unsubscribe: jest.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any)

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    await waitFor(() => expect(result.current.probing).toBe(false))
    expect(result.current.candidates.map((c) => c.symbol)).toEqual(['ETH'])
    expect(result.current.defaultAddress).toBe(ETH_ADDRESS)
    expect(initiateSpy).toHaveBeenCalledTimes(2)
  })

  it('orders native first, then remaining ERC-20s by fiat balance descending', async () => {
    jest
      .spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances')
      .mockReturnValue(
        mockBalances([
          tokenBalance({ address: USDC_ADDRESS, symbol: 'USDC', decimals: 6, fiatBalance: '500' }),
          tokenBalance({ address: ETH_ADDRESS, symbol: 'ETH', type: 'NATIVE_TOKEN', fiatBalance: '10' }),
          tokenBalance({ address: DAI_ADDRESS, symbol: 'DAI', fiatBalance: '50' }),
        ]),
      )
    jest.spyOn(gatewayApi.endpoints.getGtfFeePreview, 'initiate').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      () => (() => ({ unwrap: () => Promise.resolve({ txData: {} }), unsubscribe: jest.fn() })) as any,
    )

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    await waitFor(() => expect(result.current.probing).toBe(false))
    expect(result.current.candidates.map((c) => c.symbol)).toEqual(['ETH', 'USDC', 'DAI'])
    expect(result.current.defaultAddress).toBe(ETH_ADDRESS)
  })

  it('falls back to USDC as default when native probe errors', async () => {
    jest
      .spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances')
      .mockReturnValue(
        mockBalances([
          tokenBalance({ address: ETH_ADDRESS, symbol: 'ETH', type: 'NATIVE_TOKEN' }),
          tokenBalance({ address: USDC_ADDRESS, symbol: 'USDC', decimals: 6 }),
        ]),
      )
    jest
      .spyOn(gatewayApi.endpoints.getGtfFeePreview, 'initiate')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .mockImplementation(((arg: any) => () => ({
        unwrap:
          arg.tx.gasToken === ETH_ADDRESS
            ? () => Promise.reject(new Error('no price'))
            : () => Promise.resolve({ txData: {} }),
        unsubscribe: jest.fn(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any)

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    await waitFor(() => expect(result.current.probing).toBe(false))
    expect(result.current.candidates.map((c) => c.symbol)).toEqual(['USDC'])
    expect(result.current.defaultAddress).toBe(USDC_ADDRESS)
  })

  it('returns no candidates when every probe errors', async () => {
    jest
      .spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances')
      .mockReturnValue(
        mockBalances([
          tokenBalance({ address: UNPRICED_ADDRESS, symbol: 'TEST' }),
          tokenBalance({ address: SAFE_TOKEN_ADDRESS, symbol: 'SAFE' }),
        ]),
      )
    jest.spyOn(gatewayApi.endpoints.getGtfFeePreview, 'initiate').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (() => () => ({ unwrap: () => Promise.reject(new Error('no price')), unsubscribe: jest.fn() })) as any,
    )

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    await waitFor(() => expect(result.current.probing).toBe(false))
    expect(result.current.candidates).toEqual([])
    expect(result.current.defaultAddress).toBeUndefined()
  })

  it('reports probing=true while probes are in flight, then false once resolved', async () => {
    jest
      .spyOn(useTrustedTokenBalancesModule, 'useTrustedTokenBalances')
      .mockReturnValue(mockBalances([tokenBalance({ address: ETH_ADDRESS, symbol: 'ETH', type: 'NATIVE_TOKEN' })]))

    let resolveProbe: (() => void) | undefined
    jest.spyOn(gatewayApi.endpoints.getGtfFeePreview, 'initiate').mockImplementation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (() => () => ({
        unwrap: () => new Promise<unknown>((resolve) => (resolveProbe = () => resolve({ txData: {} }))),
        unsubscribe: jest.fn(),
      })) as any,
    )

    const { result } = renderHook(() => useGasTokenCandidates(tx))

    expect(result.current.probing).toBe(true)
    await act(async () => {
      resolveProbe?.()
    })
    await waitFor(() => expect(result.current.probing).toBe(false))
    expect(result.current.candidates).toHaveLength(1)
  })
})
