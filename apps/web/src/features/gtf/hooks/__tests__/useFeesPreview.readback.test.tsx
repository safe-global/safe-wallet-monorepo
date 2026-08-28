/**
 * Integration cover for the stored-quote read-back: the REAL `getGtfFeeSnapshot` endpoint and the
 * REAL `useSafeTxHash` run through `useFeesPreview`, with MSW at the network boundary. The sibling
 * suite mocks the query hook, so only this one can catch a wrong hash input or a wrong URL.
 */
import { useState, type ReactNode } from 'react'
import { http, HttpResponse, delay } from 'msw'
import { renderHook, waitFor } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { useFeesPreview } from '../useFeesPreview'
import { SafeTxContext } from '@/components/tx-flow/SafeTxProvider'
import * as useGasLimitModule from '@/hooks/useGasLimit'
import * as useGasPriceModule from '@/hooks/useGasPrice'
import * as useChainsModule from '@/hooks/useChains'
import * as useSafeInfoModule from '@/hooks/useSafeInfo'
import * as useBalancesModule from '@/hooks/useBalances'
import * as safeCoreSDKModule from '@/hooks/coreSDK/safeCoreSDK'
import * as useGasTokenCandidatesModule from '../useGasTokenCandidates'
import { chainBuilder } from '@/tests/builders/chains'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { eip712SafeTxHash } from '@/tests/eip712SafeTx'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { GATEWAY_URL } from '@/config/gateway'
import type { SafeTransaction, SafeTransactionData } from '@safe-global/types-kit'

const ETH = '0x0000000000000000000000000000000000000000'
const SAFE_ADDRESS = '0x1F2504De05f5167650bE5B28c472601Be434b60A'
const REFUND_RECEIVER = '0xc918e75504D1B0c741Eb4236B72Dae7A52401E95'

const mockChain = chainBuilder()
  .with({
    chainId: '1',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: 'https://eth.logo' },
    features: [FEATURES.GTF],
    relayer: {
      type: 'RELAY_FEE',
      safeCreationSponsored: false,
      safeTransactionSponsored: false,
      enableTenderlySimulationBeforeRelay: false,
    },
  })
  .build()

const mockSafe = extendedSafeInfoBuilder()
  .with({ threshold: 2, chainId: '1', version: '1.4.1', address: { value: SAFE_ADDRESS } })
  .build()

// The payload a first signer actually signs on GTF Safe-pays: locked fee fields, non-zero nonce.
const LOCKED_DATA = {
  to: '0x38D48FaDa993b749691E93e4E62259c488bCb766',
  value: '100000000000000',
  data: '0x',
  operation: 0,
  nonce: 7,
  safeTxGas: '2409',
  baseGas: '68568',
  gasPrice: '741064438',
  gasToken: ETH,
  refundReceiver: REFUND_RECEIVER,
} as unknown as SafeTransactionData

const buildSafeTx = (data: Partial<SafeTransactionData>, signatures = new Map<string, unknown>()): SafeTransaction =>
  ({ data: { ...LOCKED_DATA, ...data }, signatures }) as unknown as SafeTransaction

const signedSafeTx = buildSafeTx({}, new Map([['0xSigner', {}]]))

const withSafeTx = (safeTx: SafeTransaction | undefined, gtfPaymentMode: 'safe' | 'signer' = 'safe') =>
  function SafeTxWrapper({ children }: { children: ReactNode }) {
    const [gtfSelectedGasToken, setGtfSelectedGasToken] = useState<string | undefined>(undefined)
    return (
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
            gtfPaymentMode,
            setGtfPaymentMode: jest.fn(),
            gtfSelectedGasToken,
            setGtfSelectedGasToken,
            isReadOnly: false,
          } as never
        }
      >
        {children}
      </SafeTxContext.Provider>
    )
  }

const nativeBalance = {
  balance: '1000000000000000000',
  fiatBalance: '2500',
  fiatConversion: '2500',
  tokenInfo: { address: ETH, decimals: 18, logoUri: '', name: 'Ether', symbol: 'ETH', type: 'NATIVE_TOKEN' },
}

const SNAPSHOT_ROUTE = `${GATEWAY_URL}/v1/chains/:chainId/fees/:safeAddress/preview/:safeTxHash`
const PREVIEW_ROUTE = `${GATEWAY_URL}/v1/chains/:chainId/fees/:safeAddress/preview`

const snapshotBody = (safenetFeeUsd: number) => ({
  txData: { chainId: '1', safeAddress: SAFE_ADDRESS, ...LOCKED_DATA, numberSignatures: 2 },
  feeBreakdown: { totalUsd: 1.12, safenetFeeUsd },
  maxFeeCapUsd: 2,
})

let snapshotRequests: string[] = []

// Counting at the network boundary, not at a mock: a negative case can only pass if no request
// left the app.
const countSnapshotRequest = ({ request }: { request: Request }) => {
  if (/\/fees\/[^/]+\/preview\/0x[0-9a-fA-F]{64}$/.test(new URL(request.url).pathname)) {
    snapshotRequests.push(request.url)
  }
}

describe('useFeesPreview — stored-quote read-back (real endpoint)', () => {
  beforeAll(() => server.events.on('request:start', countSnapshotRequest))
  afterAll(() => server.events.removeListener('request:start', countSnapshotRequest))

  beforeEach(() => {
    snapshotRequests = []
    jest.restoreAllMocks()
    jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(mockChain)
    jest.spyOn(useSafeInfoModule, 'default').mockReturnValue({
      safe: mockSafe,
      safeAddress: SAFE_ADDRESS,
      safeLoaded: true,
      safeLoading: false,
    })
    jest.spyOn(useBalancesModule, 'default').mockReturnValue({
      balances: { fiatTotal: '2500', items: [nativeBalance] as never },
      loaded: true,
      loading: false,
    })
    jest.spyOn(useGasTokenCandidatesModule, 'useGasTokenCandidates').mockReturnValue({
      candidates: [{ address: ETH, symbol: 'ETH', logoUri: '', decimals: 18, fiatBalance: '2500' }],
      defaultAddress: ETH,
    })
    jest.spyOn(useGasLimitModule, 'default').mockReturnValue({ gasLimit: BigInt(21000), gasLimitLoading: false })
    jest
      .spyOn(useGasPriceModule, 'default')
      .mockReturnValue([{ maxFeePerGas: BigInt(20000000000), maxPriorityFeePerGas: undefined }, undefined, false])
    jest.spyOn(safeCoreSDKModule, 'useSafeSDK').mockReturnValue(undefined)
  })

  it('queries the hash of the SIGNED payload and itemizes the fee', async () => {
    server.use(http.get(SNAPSHOT_ROUTE, () => HttpResponse.json(snapshotBody(1))))

    const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(signedSafeTx) })

    await waitFor(() => expect(snapshotRequests).toHaveLength(1))

    const expectedHash = eip712SafeTxHash(signedSafeTx.data, mockSafe.chainId, SAFE_ADDRESS)
    expect(expectedHash).toMatch(/^0x[0-9a-f]{64}$/)
    expect(snapshotRequests[0]).toBe(
      `${GATEWAY_URL}/v1/chains/${mockSafe.chainId}/fees/${SAFE_ADDRESS}/preview/${expectedHash}`,
    )
    await waitFor(() => expect(result.current.safenetFee).toEqual({ label: 'Safenet fee', amount: '$\u200A1.00' }))
  })

  it('computes the same hash when the version comes from the SDK, not safe.version', async () => {
    jest
      .spyOn(safeCoreSDKModule, 'useSafeSDK')
      .mockReturnValue({ getContractVersion: () => '1.4.1' } as unknown as ReturnType<
        typeof safeCoreSDKModule.useSafeSDK
      >)
    server.use(http.get(SNAPSHOT_ROUTE, () => HttpResponse.json(snapshotBody(1))))

    renderHook(() => useFeesPreview(), { wrapper: withSafeTx(signedSafeTx) })

    await waitFor(() => expect(snapshotRequests).toHaveLength(1))
    expect(snapshotRequests[0]).toContain(eip712SafeTxHash(signedSafeTx.data, mockSafe.chainId, SAFE_ADDRESS))
  })

  it('leaves the card exactly as today on a 404', async () => {
    server.use(http.get(SNAPSHOT_ROUTE, () => HttpResponse.json({ message: 'no quote' }, { status: 404 })))

    const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(signedSafeTx) })

    await waitFor(() => expect(snapshotRequests).toHaveLength(1))
    expect(result.current.safenetFee).toBeUndefined()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(false)
    expect(result.current.gasFee.label).toBe('Max gas fee')
    expect(result.current.gasFee.amount).toBeDefined()
  })

  it('renders no row for a stored quote with safenetFeeUsd 0', async () => {
    server.use(http.get(SNAPSHOT_ROUTE, () => HttpResponse.json(snapshotBody(0))))

    const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(signedSafeTx) })

    await waitFor(() => expect(snapshotRequests).toHaveLength(1))
    await waitFor(() => expect(result.current.safeHasEnoughGas).toBeDefined())
    expect(result.current.safenetFee).toBeUndefined()
  })

  it('never flickers loading or error while the fetch is in flight', async () => {
    server.use(
      http.get(SNAPSHOT_ROUTE, async () => {
        await delay(60)
        return HttpResponse.json(snapshotBody(1))
      }),
    )

    const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(signedSafeTx) })

    await waitFor(() => expect(snapshotRequests).toHaveLength(1))
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(false)
    expect(result.current.safenetFee).toBeUndefined()

    await waitFor(() => expect(result.current.safenetFee).toBeDefined())
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(false)
  })

  it.each([
    ['a body carrying neither fee arm', { nonsense: true }],
    ['a null body', null],
  ])('renders no row and does not crash on %s', async (_label, body) => {
    server.use(http.get(SNAPSHOT_ROUTE, () => HttpResponse.json(body)))

    const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(signedSafeTx) })

    await waitFor(() => expect(snapshotRequests).toHaveLength(1))
    expect(result.current.safenetFee).toBeUndefined()
    expect(result.current.error).toBe(false)
    expect(result.current.loading).toBe(false)
  })

  describe('the read-back is never issued outside the confirmation branch', () => {
    const SIGNED = new Map([['0xSigner', {}]])
    const cases: Array<[string, SafeTransaction, 'safe' | 'signer']> = [
      ['first signer (no signatures)', buildSafeTx({}), 'safe'],
      // A signer-pays payload carries zero fee fields, so it is indistinguishable from a
      // pre-GTF queue item — both land on the legacy-signed branch.
      [
        'signer-pays / legacy-signed (zero fee fields)',
        buildSafeTx({ baseGas: '0', gasPrice: '0', refundReceiver: ETH }, SIGNED),
        'signer',
      ],
      [
        'legacy-signed with mode=safe',
        buildSafeTx({ baseGas: '0', gasPrice: '0', refundReceiver: ETH }, SIGNED),
        'safe',
      ],
    ]

    it.each(cases)('%s', async (_label, tx, mode) => {
      server.use(
        http.get(SNAPSHOT_ROUTE, () => HttpResponse.json(snapshotBody(1))),
        http.post(PREVIEW_ROUTE, () => HttpResponse.json(snapshotBody(1))),
      )

      const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(tx, mode) })

      await waitFor(() => expect(result.current.executionFee).toBeDefined())
      await delay(120)
      expect(snapshotRequests).toEqual([])
      expect(result.current.safenetFee).toBeUndefined()
    })

    it('skips a chain without a preview-capable relayer', async () => {
      jest.spyOn(useChainsModule, 'useCurrentChain').mockReturnValue(
        chainBuilder()
          .with({ ...mockChain, relayer: null })
          .build(),
      )
      server.use(http.get(SNAPSHOT_ROUTE, () => HttpResponse.json(snapshotBody(1))))

      const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(signedSafeTx) })

      await waitFor(() => expect(result.current.executionFee).toBeDefined())
      await delay(120)
      expect(snapshotRequests).toEqual([])
      expect(result.current.safenetFee).toBeUndefined()
    })
  })

  // The signed payload is authoritative: a payload carrying live GTF fee params is Safe-pays
  // regardless of a stale payment-mode flag in context.
  it('still reads back a GTF-signed payload while context says signer-pays', async () => {
    server.use(http.get(SNAPSHOT_ROUTE, () => HttpResponse.json(snapshotBody(1))))

    const { result } = renderHook(() => useFeesPreview(), { wrapper: withSafeTx(signedSafeTx, 'signer') })

    await waitFor(() => expect(snapshotRequests).toHaveLength(1))
    await waitFor(() => expect(result.current.safenetFee).toBeDefined())
  })
})
