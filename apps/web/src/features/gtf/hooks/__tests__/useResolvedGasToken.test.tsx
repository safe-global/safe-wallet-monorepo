import { waitFor } from '@testing-library/react'
import { skipToken } from '@reduxjs/toolkit/query'
import { OperationType } from '@safe-global/types-kit'
import { renderHook } from '@/tests/test-utils'
import { useResolvedGasToken, type FeePreviewTx } from '../useResolvedGasToken'
import * as useChainsModule from '@/hooks/useChains'
import * as useSafeInfoModule from '@/hooks/useSafeInfo'
import { getNonces } from '@/services/tx/tx-sender/recommendedNonce'
import * as gatewayApi from '@/store/api/gateway'
import { chainBuilder } from '@/tests/builders/chains'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { FEATURES } from '@safe-global/utils/utils/chains'

jest.mock('@/services/tx/tx-sender/recommendedNonce', () => ({
  getNonces: jest.fn(),
}))

const RECOMMENDED_NONCE = 7

const ETH_ADDRESS = '0x0000000000000000000000000000000000000000'
const SAFE_TOKEN_ADDRESS = '0x5aFE3855358E112B5647B952709E6165e1c1eEEe'

const mockChain = chainBuilder()
  .with({
    chainId: '1',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: '' },
    features: [FEATURES.GTF],
    relayer: {
      type: 'RELAY_FEE',
      safeCreationSponsored: false,
      safeTransactionSponsored: false,
      enableTenderlySimulationBeforeRelay: false,
    },
  })
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
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(loadingProbe)

    const { result } = renderHook(() => useResolvedGasToken(ETH_ADDRESS, undefined))

    expect(result.current.status).toBe('resolving')
  })

  // Regression (PLA-1774): only the sent token is ever probed — no cascade over held tokens.
  it('probes only the sent token and resolves to it on 200', async () => {
    const spy = jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(successfulProbe)

    const { result } = renderHook(() => useResolvedGasToken(SAFE_TOKEN_ADDRESS, erc20Tx))

    await waitFor(() => expect(result.current).toEqual({ status: 'resolved', address: SAFE_TOKEN_ADDRESS }))
    expect(spy.mock.calls.at(-1)?.[0]).toMatchObject({
      tx: expect.objectContaining({ gasToken: SAFE_TOKEN_ADDRESS, nonce: RECOMMENDED_NONCE }),
    })
    spy.mock.calls.forEach(([arg]) => {
      if (arg !== skipToken) {
        expect((arg as { tx: { gasToken: string } }).tx.gasToken).toBe(SAFE_TOKEN_ADDRESS)
      }
    })
  })

  // Regression: if getNonces rejects, the hook must not get stuck in `resolving` forever, it falls
  // back to the Safe current nonce so the probe still fires and resolution progresses.
  it('falls back to the current Safe nonce and still resolves when getNonces rejects', async () => {
    ;(getNonces as jest.Mock).mockRejectedValue(new Error('RPC down'))
    const spy = jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(successfulProbe)

    const { result } = renderHook(() => useResolvedGasToken(ETH_ADDRESS, nativeTx))

    await waitFor(() => expect(result.current).toEqual({ status: 'resolved', address: ETH_ADDRESS }))
    expect(spy.mock.calls.at(-1)?.[0]).toMatchObject({
      tx: expect.objectContaining({ nonce: mockSafe.nonce }),
    })
  })

  it('blocks when the sent token probe errors', async () => {
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(erroredProbe)

    const { result } = renderHook(() => useResolvedGasToken(SAFE_TOKEN_ADDRESS, erc20Tx))

    await waitFor(() => expect(result.current).toEqual({ status: 'blocked' }))
  })

  it('returns resolving while the probe is in-flight', () => {
    jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(loadingProbe)

    const { result } = renderHook(() => useResolvedGasToken(SAFE_TOKEN_ADDRESS, erc20Tx))

    expect(result.current.status).toBe('resolving')
  })

  it('returns blocked without firing a single probe when the chain has no RELAY_FEE relayer', () => {
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(
      chainBuilder()
        .with({ ...mockChain, relayer: null })
        .build(),
    )
    const spy = jest.spyOn(gatewayApi, 'useGetGtfFeePreviewQuery').mockReturnValue(loadingProbe)

    const { result } = renderHook(() => useResolvedGasToken(SAFE_TOKEN_ADDRESS, erc20Tx))

    expect(result.current).toEqual({ status: 'blocked' })
    expect(spy.mock.calls.length).toBeGreaterThan(0)
    spy.mock.calls.forEach(([arg]) => expect(arg).toBe(skipToken))
  })
})
