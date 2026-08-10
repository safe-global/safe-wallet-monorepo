import { configureStore, type UnknownAction } from '@reduxjs/toolkit'
import {
  AttestationVerificationStatus,
  CheckStatus,
  UNVERIFIED_ATTESTATION,
  getSafenetReader,
  type CheckReadResult,
} from '@safe-global/utils/features/safenet-checks'
import {
  attestedEvent,
  plainAttestedEvent,
  requestCreatedEvent,
} from '@safe-global/utils/features/safenet-checks/builders'
import { safenetCheckApi } from '../safenetCheckApi'
import {
  pinVerdict,
  safenetCheckSlice,
  selectPinnedVerdict,
  type SafenetCheckPartialState,
  type SafenetCheckSliceState,
} from '../safenetCheckSlice'

jest.mock('@safe-global/utils/features/safenet-checks', () => ({
  ...jest.requireActual('@safe-global/utils/features/safenet-checks'),
  getSafenetReader: jest.fn(),
}))

const mockedGetReader = getSafenetReader as jest.MockedFunction<typeof getSafenetReader>

const HASH = ('0x' + 'cd'.repeat(32)) as `0x${string}`
const REQUEST_ID = ('0x' + 'ef'.repeat(32)) as `0x${string}`

const fakeReader = { fetchCheckState: jest.fn(), verifyAttestation: jest.fn() }

const baseRead = (over: Partial<CheckReadResult> = {}): CheckReadResult => ({
  safeTxHash: HASH,
  chainId: '100',
  events: [],
  headBlock: '100',
  generation: null,
  requestId: null,
  epoch: null,
  oracle: null,
  deadlineBlock: null,
  ...over,
})

const makeTestStore = () =>
  configureStore({
    reducer: {
      [safenetCheckSlice.name]: safenetCheckSlice.reducer,
      [safenetCheckApi.reducerPath]: safenetCheckApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(safenetCheckApi.middleware),
  })

const runQuery = (store: ReturnType<typeof makeTestStore>) =>
  store.dispatch(safenetCheckApi.endpoints.getSafenetCheck.initiate({ safeTxHash: HASH }, { forceRefetch: true }))

beforeEach(() => {
  fakeReader.fetchCheckState.mockReset()
  fakeReader.verifyAttestation.mockReset()
  mockedGetReader.mockReturnValue(fakeReader as unknown as ReturnType<typeof getSafenetReader>)
})

describe('safenetCheckApi.getSafenetCheck', () => {
  // The non-oracle path is the only one live beta emits, so it needs its own
  // case: it reaches the same verify call, with no requestId in the read.
  it('verifies a non-oracle attestation and derives BENIGN', async () => {
    const attested = plainAttestedEvent({ safeTxHash: HASH })
    fakeReader.fetchCheckState.mockResolvedValue(baseRead({ events: [attested], requestId: null }))
    fakeReader.verifyAttestation.mockResolvedValue({
      status: AttestationVerificationStatus.VERIFIED,
      signatureId: attested.signatureId,
      message: '0xplain',
    })

    const store = makeTestStore()
    const result = await runQuery(store)

    expect(fakeReader.verifyAttestation).toHaveBeenCalledWith(attested)
    expect(result.data?.status).toBe(CheckStatus.BENIGN)
  })

  it('derives BENIGN when an attestation verifies, and pins it', async () => {
    fakeReader.fetchCheckState.mockResolvedValue(
      baseRead({ events: [attestedEvent({ safeTxHash: HASH })], requestId: REQUEST_ID, epoch: '1' }),
    )
    fakeReader.verifyAttestation.mockResolvedValue({
      status: AttestationVerificationStatus.VERIFIED,
      signatureId: REQUEST_ID,
      message: REQUEST_ID,
    })
    const store = makeTestStore()

    const result = await runQuery(store)

    expect(result.data?.status).toBe(CheckStatus.BENIGN)
    expect(selectPinnedVerdict(store.getState() as SafenetCheckPartialState, HASH)?.status).toBe(CheckStatus.BENIGN)
  })

  it('does not verify when there is no attestation, and derives IN_PROGRESS from activity', async () => {
    fakeReader.fetchCheckState.mockResolvedValue(
      baseRead({ events: [requestCreatedEvent({ deadlineBlock: '1000' })], deadlineBlock: '1000', headBlock: '100' }),
    )
    const store = makeTestStore()

    const result = await runQuery(store)

    expect(fakeReader.verifyAttestation).not.toHaveBeenCalled()
    expect(result.data?.status).toBe(CheckStatus.IN_PROGRESS)
    expect(selectPinnedVerdict(store.getState() as SafenetCheckPartialState, HASH)?.status).toBe(
      CheckStatus.IN_PROGRESS,
    )
  })

  it('never walks a pinned verdict backwards — a later transient re-derivation keeps BENIGN', async () => {
    const store = makeTestStore()

    // Poll 1: attested + verified → BENIGN, pinned.
    fakeReader.fetchCheckState.mockResolvedValueOnce(
      baseRead({ events: [attestedEvent({ safeTxHash: HASH })], requestId: REQUEST_ID, epoch: '1' }),
    )
    fakeReader.verifyAttestation.mockResolvedValueOnce({
      status: AttestationVerificationStatus.VERIFIED,
      signatureId: REQUEST_ID,
      message: REQUEST_ID,
    })
    const first = await runQuery(store)
    expect(first.data?.status).toBe(CheckStatus.BENIGN)

    // Poll 2: a reorg drops the attestation → would derive IN_PROGRESS, but the
    // pinned BENIGN is terminal, so the merged status stays BENIGN.
    fakeReader.fetchCheckState.mockResolvedValueOnce(
      baseRead({ events: [requestCreatedEvent({ deadlineBlock: '1000' })], deadlineBlock: '1000', headBlock: '100' }),
    )
    const second = await runQuery(store)

    expect(second.data?.status).toBe(CheckStatus.BENIGN)
    expect(selectPinnedVerdict(store.getState() as SafenetCheckPartialState, HASH)?.status).toBe(CheckStatus.BENIGN)
  })

  it('upgrades the pin forward on a rank increase (IN_PROGRESS → BENIGN)', async () => {
    const store = makeTestStore()

    fakeReader.fetchCheckState.mockResolvedValueOnce(
      baseRead({ events: [requestCreatedEvent({ deadlineBlock: '1000' })], deadlineBlock: '1000', headBlock: '100' }),
    )
    await runQuery(store)
    expect(selectPinnedVerdict(store.getState() as SafenetCheckPartialState, HASH)?.status).toBe(
      CheckStatus.IN_PROGRESS,
    )

    fakeReader.fetchCheckState.mockResolvedValueOnce(
      baseRead({ events: [attestedEvent({ safeTxHash: HASH })], requestId: REQUEST_ID, epoch: '1' }),
    )
    fakeReader.verifyAttestation.mockResolvedValueOnce({
      status: AttestationVerificationStatus.VERIFIED,
      signatureId: REQUEST_ID,
      message: REQUEST_ID,
    })
    const second = await runQuery(store)

    expect(second.data?.status).toBe(CheckStatus.BENIGN)
    expect(selectPinnedVerdict(store.getState() as SafenetCheckPartialState, HASH)?.status).toBe(CheckStatus.BENIGN)
  })

  it('returns an error (RTK Query retains the last snapshot) when the read fails', async () => {
    fakeReader.fetchCheckState.mockRejectedValue(new Error('rpc down'))
    const store = makeTestStore()

    const result = await runQuery(store)

    expect(result.data).toBeUndefined()
    expect(result.status).toBe('rejected')
    expect(selectPinnedVerdict(store.getState() as SafenetCheckPartialState, HASH)).toBeUndefined()
  })

  it('marks the attestation UNVERIFIED in the snapshot when there is no attestation event', async () => {
    fakeReader.fetchCheckState.mockResolvedValue(baseRead({ events: [requestCreatedEvent({ deadlineBlock: '1000' })] }))
    const store = makeTestStore()

    const result = await runQuery(store)

    expect(result.data?.attestation).toEqual(UNVERIFIED_ATTESTATION)
  })

  it('verifies the ORACLE attestation when both paths attested, regardless of chain order', async () => {
    // Ascending event order puts the plain attestation FIRST (beta attests in
    // ~5 blocks; the oracle path needs commit/reveal) — the oracle one must
    // still be the event that gets verified, since deriveCheckState consumes
    // the verification result through its oracle branch first.
    const plain = plainAttestedEvent({ safeTxHash: HASH, blockNumber: 100 })
    const oracle = attestedEvent({ safeTxHash: HASH, blockNumber: 200 })
    fakeReader.fetchCheckState.mockResolvedValue(baseRead({ events: [plain, oracle] }))
    fakeReader.verifyAttestation.mockResolvedValue({
      status: AttestationVerificationStatus.VERIFIED,
      signatureId: REQUEST_ID,
      message: REQUEST_ID,
    })
    const store = makeTestStore()

    await runQuery(store)

    expect(fakeReader.verifyAttestation).toHaveBeenCalledTimes(1)
    expect(fakeReader.verifyAttestation).toHaveBeenCalledWith(oracle)
  })

  it('never pins UNAVAILABLE — a no-check transaction leaves the slice untouched', async () => {
    fakeReader.fetchCheckState.mockResolvedValue(baseRead({ events: [] }))
    const store = makeTestStore()

    const result = await runQuery(store)

    expect(result.data?.status).toBe(CheckStatus.UNAVAILABLE)
    expect(selectPinnedVerdict(store.getState() as SafenetCheckPartialState, HASH)).toBeUndefined()
  })

  it('does not re-dispatch the pin when a re-poll derives the same status', async () => {
    const pins: unknown[] = []
    const store = configureStore({
      reducer: {
        [safenetCheckSlice.name]: (state: SafenetCheckSliceState | undefined, action: UnknownAction) => {
          if (pinVerdict.match(action)) pins.push(action)
          return safenetCheckSlice.reducer(state, action)
        },
        [safenetCheckApi.reducerPath]: safenetCheckApi.reducer,
      },
      middleware: (getDefault) => getDefault().concat(safenetCheckApi.middleware),
    })
    fakeReader.fetchCheckState.mockResolvedValue(baseRead({ events: [plainAttestedEvent({ safeTxHash: HASH })] }))
    fakeReader.verifyAttestation.mockResolvedValue({
      status: AttestationVerificationStatus.VERIFIED,
      signatureId: REQUEST_ID,
      message: REQUEST_ID,
    })

    await runQuery(store)
    await runQuery(store)

    expect(pins).toHaveLength(1)
  })

  it('forwards timestampMs so the reader can aim its block window', async () => {
    fakeReader.fetchCheckState.mockResolvedValue(baseRead())
    const store = makeTestStore()

    await store.dispatch(
      safenetCheckApi.endpoints.getSafenetCheck.initiate({ safeTxHash: HASH, timestampMs: 1_700_000_000_000 }),
    )

    expect(fakeReader.fetchCheckState).toHaveBeenCalledWith(HASH, { timestampMs: 1_700_000_000_000 })
  })

  it('keeps ONE cache entry per hash however the timestamp varies (single poll loop)', async () => {
    fakeReader.fetchCheckState.mockResolvedValue(baseRead())
    const store = makeTestStore()

    await store.dispatch(safenetCheckApi.endpoints.getSafenetCheck.initiate({ safeTxHash: HASH, timestampMs: 1_000 }))
    await store.dispatch(safenetCheckApi.endpoints.getSafenetCheck.initiate({ safeTxHash: HASH, timestampMs: 2_000 }))

    const queries = store.getState()[safenetCheckApi.reducerPath].queries
    expect(Object.keys(queries)).toHaveLength(1)
    expect(fakeReader.fetchCheckState).toHaveBeenCalledTimes(1)
  })
})
