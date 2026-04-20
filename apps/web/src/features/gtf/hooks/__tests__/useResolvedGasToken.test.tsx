import type { ReactNode } from 'react'
import { act } from '@testing-library/react'
import { renderHook } from '@/tests/test-utils'
import { useResolvedGasToken } from '../useResolvedGasToken'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import * as useChainsModule from '@/hooks/useChains'
import * as useSafeInfoModule from '@/hooks/useSafeInfo'
import * as useBalancesModule from '@/hooks/useBalances'
import * as gatewayApi from '@/store/api/gateway'
import { chainBuilder } from '@/tests/builders/chains'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import type { SafeTransaction, SafeTransactionData } from '@safe-global/types-kit'

const ETH_ADDRESS = '0x0000000000000000000000000000000000000000'
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const SAFE_TOKEN_ADDRESS = '0x5aFE3855358E112B5647B952709E6165e1c1eEEe'

const mockChain = chainBuilder()
  .with({ chainId: '1', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: '' } })
  .build()

const mockSafe = extendedSafeInfoBuilder().with({ threshold: 1 }).build()

const buildSafeTx = (data: Partial<SafeTransactionData> = {}): SafeTransaction =>
  ({
    data: {
      to: SAFE_TOKEN_ADDRESS,
      value: '0',
      data: '0x',
      operation: 0,
      nonce: 0,
      safeTxGas: '0',
      baseGas: '0',
      gasPrice: '0',
      gasToken: ETH_ADDRESS,
      refundReceiver: ETH_ADDRESS,
      ...data,
    },
    signatures: new Map(),
  }) as unknown as SafeTransaction

const ethBalance = {
  balance: '1000000000000000000',
  fiatBalance: '2500',
  fiatConversion: '2500',
  tokenInfo: { address: ETH_ADDRESS, decimals: 18, logoUri: '', name: 'Ether', symbol: 'ETH', type: 'NATIVE_TOKEN' },
}
const usdcBalance = {
  balance: '100000000',
  fiatBalance: '100',
  fiatConversion: '1',
  tokenInfo: { address: USDC_ADDRESS, decimals: 6, logoUri: '', name: 'USD Coin', symbol: 'USDC', type: 'ERC20' },
}
const safeTokenBalance = {
  balance: '5000000000000000000',
  fiatBalance: '10',
  fiatConversion: '2',
  tokenInfo: {
    address: SAFE_TOKEN_ADDRESS,
    decimals: 18,
    logoUri: '',
    name: 'Safe',
    symbol: 'SAFE',
    type: 'ERC20',
  },
}

const buildBalances = (items: unknown[]): ReturnType<typeof useBalancesModule.default> => ({
  balances: { fiatTotal: '1000', items: items as never },
  loaded: true,
  loading: false,
})

const successfulProbe = {
  data: { txData: { gasToken: ETH_ADDRESS } },
  isLoading: false,
  isFetching: false,
  error: undefined,
  refetch: jest.fn(),
} as unknown as ReturnType<typeof gatewayApi.useGetGtfFeePreviewQuery>

const erroredProbe = {
  data: undefined,
  isLoading: false,
  isFetching: false,
  error: new Error('403'),
  refetch: jest.fn(),
} as unknown as ReturnType<typeof gatewayApi.useGetGtfFeePreviewQuery>

const loadingProbe = {
  data: undefined,
  isLoading: true,
  isFetching: true,
  error: undefined,
  refetch: jest.fn(),
} as unknown as ReturnType<typeof gatewayApi.useGetGtfFeePreviewQuery>

const withSafeTx =
  (safeTx: SafeTransaction | undefined) =>
  ({ children }: { children: ReactNode }) => (
    <SafeTxContext.Provider
      value={
        {
          safeTx,
          setSafeTx: jest.fn(),
          setSafeMessage: jest.fn(),
          setSafeMessageHash: jest.fn(),
          setSafeTxError: jest.fn(),
          setNonce: jest.fn(),
          setNonceNeeded: jest.fn(),
          setSafeTxGas: jest.fn(),
          setTxOrigin: jest.fn(),
          isReadOnly: false,
        } as never
      }
    >
      {children}
    </SafeTxContext.Provider>
  )

describe('useResolvedGasToken', () => {
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

  it('returns resolving while safeTx is undefined', () => {
    jest.spyOn(useBalancesModule, 'default').mockReturnValue(buildBalances([ethBalance]))
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(loadingProbe)

    const { result } = renderHook(() => useResolvedGasToken(ETH_ADDRESS), {
      wrapper: withSafeTx(undefined),
    })

    expect(result.current.status).toBe('resolving')
  })

  it('resolves to the first alternative that probes successfully (ETH wins immediately)', () => {
    jest.spyOn(useBalancesModule, 'default').mockReturnValue(buildBalances([ethBalance, safeTokenBalance]))
    const spy = jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(successfulProbe)

    const { result } = renderHook(() => useResolvedGasToken(SAFE_TOKEN_ADDRESS), {
      wrapper: withSafeTx(buildSafeTx()),
    })

    expect(result.current).toEqual({ status: 'resolved', address: ETH_ADDRESS })
    // first call is for ETH (index 0)
    expect(spy.mock.calls[0][0]).toMatchObject({ tx: expect.objectContaining({ gasToken: ETH_ADDRESS }) })
  })

  it('falls through from errored alternatives to the sent token when it probes 200', () => {
    jest.spyOn(useBalancesModule, 'default').mockReturnValue(buildBalances([ethBalance, safeTokenBalance]))
    // Error on ETH probe, then success on SAFE probe as the hook advances the index.
    const querySpy = jest
      .spyOn(gatewayApi, 'useGetGtfFeePreviewQuery')
      .mockImplementationOnce(() => erroredProbe)
      .mockImplementation(() => successfulProbe)

    const { result, rerender } = renderHook(() => useResolvedGasToken(SAFE_TOKEN_ADDRESS), {
      wrapper: withSafeTx(buildSafeTx()),
    })

    // After first render, the error triggers useEffect → setIndex(1) → re-render
    act(() => {
      rerender()
    })

    expect(result.current).toEqual({ status: 'resolved', address: SAFE_TOKEN_ADDRESS })
    expect(querySpy).toHaveBeenCalled()
  })

  it('blocks when every candidate errors (including the sent token)', () => {
    jest.spyOn(useBalancesModule, 'default').mockReturnValue(buildBalances([safeTokenBalance]))
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(erroredProbe)

    const { result, rerender } = renderHook(() => useResolvedGasToken(SAFE_TOKEN_ADDRESS), {
      wrapper: withSafeTx(buildSafeTx()),
    })

    // Single-candidate (sent = SAFE), probe errors, index can't advance → blocked.
    act(() => {
      rerender()
    })

    expect(result.current).toEqual({ status: 'blocked' })
  })

  it('resolves to sent token (banner-shown case) when it is the only held candidate and probes 200', () => {
    jest.spyOn(useBalancesModule, 'default').mockReturnValue(buildBalances([safeTokenBalance]))
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(successfulProbe)

    const { result } = renderHook(() => useResolvedGasToken(SAFE_TOKEN_ADDRESS), {
      wrapper: withSafeTx(buildSafeTx()),
    })

    expect(result.current).toEqual({ status: 'resolved', address: SAFE_TOKEN_ADDRESS })
  })

  it('handles sent token already being the best candidate (e.g. sending ETH when Safe holds ETH)', () => {
    jest.spyOn(useBalancesModule, 'default').mockReturnValue(buildBalances([ethBalance]))
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(successfulProbe)

    const { result } = renderHook(() => useResolvedGasToken(ETH_ADDRESS), {
      wrapper: withSafeTx(buildSafeTx({ to: ETH_ADDRESS })),
    })

    // Candidates dedupe: ETH appears once (as sent token). Probe passes → resolved = ETH.
    expect(result.current).toEqual({ status: 'resolved', address: ETH_ADDRESS })
  })

  it('returns resolving while probe is in-flight', () => {
    jest.spyOn(useBalancesModule, 'default').mockReturnValue(buildBalances([ethBalance, safeTokenBalance]))
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(loadingProbe)

    const { result } = renderHook(() => useResolvedGasToken(SAFE_TOKEN_ADDRESS), {
      wrapper: withSafeTx(buildSafeTx()),
    })

    expect(result.current.status).toBe('resolving')
  })
})
