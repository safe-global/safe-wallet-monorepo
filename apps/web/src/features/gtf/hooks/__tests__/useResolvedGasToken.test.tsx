import { waitFor } from '@testing-library/react'
import { OperationType } from '@safe-global/types-kit'
import { renderHook } from '@/tests/test-utils'
import { useResolvedGasToken, type FeePreviewTx } from '../useResolvedGasToken'
import * as useChainsModule from '@/hooks/useChains'
import * as useSafeInfoModule from '@/hooks/useSafeInfo'
import * as useBalancesModule from '@/hooks/useBalances'
import { getNonces } from '@/services/tx/tx-sender/recommendedNonce'
import * as gatewayApi from '@/store/api/gateway'
import { chainBuilder } from '@/tests/builders/chains'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'

jest.mock('@/services/tx/tx-sender/recommendedNonce', () => ({
  getNonces: jest.fn(),
}))

// The Create-step probe prices against the recommended next nonce, fetched async via getNonces.
const RECOMMENDED_NONCE = 7

const ETH_ADDRESS = '0x0000000000000000000000000000000000000000'
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const SAFE_TOKEN_ADDRESS = '0x5aFE3855358E112B5647B952709E6165e1c1eEEe'

const mockChain = chainBuilder()
  .with({ chainId: '1', nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: '' } })
  .build()

const mockSafe = extendedSafeInfoBuilder().with({ threshold: 1 }).build()

const nativeTx: FeePreviewTx = {
  to: '0x38D48FaDa993b749691E93e4E62259c488bCb766',
  value: '100000000000000',
  data: '0x',
  operation: OperationType.Call,
}

const erc20Tx: FeePreviewTx = {
  to: SAFE_TOKEN_ADDRESS,
  value: '0',
  data: '0xa9059cbb00000000000000000000000038d48fada993b749691e93e4e62259c488bcb766000000000000000000000000000000000000000000000000000ffcb9e57d4000',
  operation: OperationType.Call,
}

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

describe('useResolvedGasToken', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    ;(getNonces as jest.Mock).mockResolvedValue({ currentNonce: 5, recommendedNonce: RECOMMENDED_NONCE })
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(mockChain)
    jest.spyOn(useSafeInfoModule, 'default').mockReturnValue({
      safe: mockSafe,
      safeAddress: mockSafe.address.value,
      safeLoaded: true,
      safeLoading: false,
    })
  })

  it('returns resolving while the tx payload is undefined', () => {
    jest.spyOn(useBalancesModule, 'default').mockReturnValue(buildBalances([ethBalance]))
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(loadingProbe)

    const { result } = renderHook(() => useResolvedGasToken(ETH_ADDRESS, undefined))

    expect(result.current.status).toBe('resolving')
  })

  it('resolves to the first alternative that probes successfully (ETH wins immediately)', async () => {
    jest.spyOn(useBalancesModule, 'default').mockReturnValue(buildBalances([ethBalance, safeTokenBalance]))
    const spy = jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(successfulProbe)

    const { result } = renderHook(() => useResolvedGasToken(SAFE_TOKEN_ADDRESS, erc20Tx))

    await waitFor(() => expect(result.current).toEqual({ status: 'resolved', address: ETH_ADDRESS }))
    // The probe is priced against the recommended next nonce, not the Safe's current nonce.
    expect(spy.mock.calls.at(-1)?.[0]).toMatchObject({
      tx: expect.objectContaining({ gasToken: ETH_ADDRESS, nonce: RECOMMENDED_NONCE }),
    })
  })

  it('falls through from errored alternatives to the sent token when it probes 200', async () => {
    jest.spyOn(useBalancesModule, 'default').mockReturnValue(buildBalances([ethBalance, safeTokenBalance]))
    // ETH (the alternative, tried first) errors; the sent token (SAFE) probes 200. Keyed by the
    // candidate gasToken rather than call order — the async nonce fetch adds extra renders.
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockImplementation((arg) => {
      const gasToken =
        arg && typeof arg === 'object' && 'tx' in arg ? (arg as { tx: { gasToken: string } }).tx.gasToken : undefined
      return gasToken === ETH_ADDRESS ? erroredProbe : successfulProbe
    })

    const { result } = renderHook(() => useResolvedGasToken(SAFE_TOKEN_ADDRESS, erc20Tx))

    await waitFor(() => expect(result.current).toEqual({ status: 'resolved', address: SAFE_TOKEN_ADDRESS }))
  })

  it('blocks when every candidate errors (including the sent token)', async () => {
    jest.spyOn(useBalancesModule, 'default').mockReturnValue(buildBalances([safeTokenBalance]))
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(erroredProbe)

    const { result } = renderHook(() => useResolvedGasToken(SAFE_TOKEN_ADDRESS, erc20Tx))

    await waitFor(() => expect(result.current).toEqual({ status: 'blocked' }))
  })

  it('resolves to sent token (banner-shown case) when it is the only held candidate and probes 200', async () => {
    jest.spyOn(useBalancesModule, 'default').mockReturnValue(buildBalances([safeTokenBalance]))
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(successfulProbe)

    const { result } = renderHook(() => useResolvedGasToken(SAFE_TOKEN_ADDRESS, erc20Tx))

    await waitFor(() => expect(result.current).toEqual({ status: 'resolved', address: SAFE_TOKEN_ADDRESS }))
  })

  it('handles sent token already being the only candidate (e.g. sending ETH when Safe holds ETH)', async () => {
    jest.spyOn(useBalancesModule, 'default').mockReturnValue(buildBalances([ethBalance]))
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(successfulProbe)

    const { result } = renderHook(() => useResolvedGasToken(ETH_ADDRESS, nativeTx))

    await waitFor(() => expect(result.current).toEqual({ status: 'resolved', address: ETH_ADDRESS }))
  })

  it('returns resolving while probe is in-flight', () => {
    jest.spyOn(useBalancesModule, 'default').mockReturnValue(buildBalances([ethBalance, safeTokenBalance]))
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(loadingProbe)

    const { result } = renderHook(() => useResolvedGasToken(SAFE_TOKEN_ADDRESS, erc20Tx))

    expect(result.current.status).toBe('resolving')
  })

  it('ignores usdcBalance entry when sentTokenAddress dedupes', async () => {
    // send USDC — candidates should dedupe (USDC appears once as sent token, not as alternative)
    jest.spyOn(useBalancesModule, 'default').mockReturnValue(buildBalances([usdcBalance]))
    const spy = jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(successfulProbe)

    const usdcTx: FeePreviewTx = { ...erc20Tx, to: USDC_ADDRESS }
    const { result } = renderHook(() => useResolvedGasToken(USDC_ADDRESS, usdcTx))

    await waitFor(() => expect(result.current).toEqual({ status: 'resolved', address: USDC_ADDRESS }))
    expect(spy.mock.calls.at(-1)?.[0]).toMatchObject({ tx: expect.objectContaining({ gasToken: USDC_ADDRESS }) })
  })
})
