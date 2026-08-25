import { configureStore, type UnknownAction } from '@reduxjs/toolkit'
import {
  AttestationVerificationStatus,
  CheckStatus,
  UNVERIFIED_ATTESTATION,
  getSafenetReader,
  type CheckReadResult,
  type CheckTarget,
  type PlainAttestedEvent,
} from '@safe-global/utils/features/safenet-checks'
import {
  attestedEvent,
  plainProposedEvent,
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
const EARLY_SIG = ('0x' + '11'.repeat(32)) as `0x${string}`
const LATE_SIG = ('0x' + '22'.repeat(32)) as `0x${string}`
const CHAIN_ID = '100'
const SAFE = '0x0000000000000000000000000000000000000abc'
const TARGET = { chainId: CHAIN_ID, safeAddress: SAFE }
/** Attested-event fields that bind an attestation to the Safe under test. */
const BOUND = { chainId: CHAIN_ID, safe: SAFE }

const fakeReader = { fetchCheckState: jest.fn(), verifyAttestation: jest.fn(), blockTimeMs: jest.fn() }

const baseRead = (over: Partial<CheckReadResult> = {}): CheckReadResult => ({
  safeTxHash: HASH,
  chainId: '100',
  events: [],
  headBlock: '100',
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

const runQuery = (store: ReturnType<typeof makeTestStore>, over: Partial<CheckTarget> = {}) =>
  store.dispatch(
    safenetCheckApi.endpoints.getSafenetCheck.initiate(
      { safeTxHash: HASH, ...TARGET, ...over },
      { forceRefetch: true },
    ),
  )

beforeEach(() => {
  fakeReader.fetchCheckState.mockReset()
  fakeReader.verifyAttestation.mockReset()
  fakeReader.blockTimeMs.mockReset()
  fakeReader.blockTimeMs.mockResolvedValue(null)
  mockedGetReader.mockReturnValue(fakeReader as unknown as ReturnType<typeof getSafenetReader>)
})

describe('safenetCheckApi.getSafenetCheck', () => {
  // The non-oracle path is the only one live beta emits, so it needs its own
  // case: it reaches the same verify call, with no requestId in the read.
  it('verifies a non-oracle attestation and derives BENIGN', async () => {
    const attested = plainAttestedEvent({ safeTxHash: HASH, ...BOUND })
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
      baseRead({ events: [attestedEvent({ safeTxHash: HASH, ...BOUND })], requestId: REQUEST_ID, epoch: '1' }),
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

  it('dates the snapshot from the attested block, reading that header once', async () => {
    const attested = attestedEvent({ safeTxHash: HASH, ...BOUND })
    fakeReader.fetchCheckState.mockResolvedValue(baseRead({ events: [attested], requestId: REQUEST_ID, epoch: '1' }))
    fakeReader.verifyAttestation.mockResolvedValue({
      status: AttestationVerificationStatus.VERIFIED,
      signatureId: REQUEST_ID,
      message: REQUEST_ID,
    })
    fakeReader.blockTimeMs.mockResolvedValue(1_785_749_985_000)

    const result = await runQuery(makeTestStore())

    expect(fakeReader.blockTimeMs).toHaveBeenCalledTimes(1)
    expect(fakeReader.blockTimeMs).toHaveBeenCalledWith(attested.blockNumber)
    expect(result.data?.attestedAtMs).toBe(1_785_749_985_000)
  })

  it('keeps the verdict when the attested header cannot be read — only the date is lost', async () => {
    const attested = attestedEvent({ safeTxHash: HASH, ...BOUND })
    fakeReader.fetchCheckState.mockResolvedValue(baseRead({ events: [attested], requestId: REQUEST_ID, epoch: '1' }))
    fakeReader.verifyAttestation.mockResolvedValue({
      status: AttestationVerificationStatus.VERIFIED,
      signatureId: REQUEST_ID,
      message: REQUEST_ID,
    })
    fakeReader.blockTimeMs.mockResolvedValue(null)

    const result = await runQuery(makeTestStore())

    expect(result.data?.status).toBe(CheckStatus.BENIGN)
    expect(result.data?.attestedAtMs).toBeNull()
  })

  it('never walks a pinned verdict backwards — a later transient re-derivation keeps BENIGN', async () => {
    const store = makeTestStore()

    // Poll 1: attested + verified → BENIGN, pinned.
    fakeReader.fetchCheckState.mockResolvedValueOnce(
      baseRead({ events: [attestedEvent({ safeTxHash: HASH, ...BOUND })], requestId: REQUEST_ID, epoch: '1' }),
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
      baseRead({ events: [attestedEvent({ safeTxHash: HASH, ...BOUND })], requestId: REQUEST_ID, epoch: '1' }),
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
    const plain = plainAttestedEvent({ safeTxHash: HASH, blockNumber: 100, ...BOUND })
    const oracle = attestedEvent({ safeTxHash: HASH, blockNumber: 200, ...BOUND })
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
    fakeReader.fetchCheckState.mockResolvedValue(
      baseRead({ events: [plainAttestedEvent({ safeTxHash: HASH, ...BOUND })] }),
    )
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
      safenetCheckApi.endpoints.getSafenetCheck.initiate({
        safeTxHash: HASH,
        ...TARGET,
        timestampMs: 1_700_000_000_000,
      }),
    )

    expect(fakeReader.fetchCheckState).toHaveBeenCalledWith(HASH, { timestampMs: 1_700_000_000_000 })
  })

  it('keeps ONE cache entry per check however the timestamp varies (single poll loop)', async () => {
    fakeReader.fetchCheckState.mockResolvedValue(baseRead())
    const store = makeTestStore()

    const args = { safeTxHash: HASH, ...TARGET }
    await store.dispatch(safenetCheckApi.endpoints.getSafenetCheck.initiate({ ...args, timestampMs: 1_000 }))
    await store.dispatch(safenetCheckApi.endpoints.getSafenetCheck.initiate({ ...args, timestampMs: 2_000 }))

    const queries = store.getState()[safenetCheckApi.reducerPath].queries
    expect(Object.keys(queries)).toHaveLength(1)
    expect(fakeReader.fetchCheckState).toHaveBeenCalledTimes(1)
  })

  describe('attestation selection', () => {
    // A cross-epoch re-proposal is the protocol's only retry, so a check can
    // carry two attestations for one hash.
    const pair = () => [
      plainAttestedEvent({ safeTxHash: HASH, blockNumber: 100, epoch: '10', signatureId: EARLY_SIG, ...BOUND }),
      plainAttestedEvent({ safeTxHash: HASH, blockNumber: 200, epoch: '11', signatureId: LATE_SIG, ...BOUND }),
    ]

    const verifyBy = (statusBySignature: Record<string, AttestationVerificationStatus>) =>
      fakeReader.verifyAttestation.mockImplementation(async (event: PlainAttestedEvent) => ({
        status: statusBySignature[event.signatureId],
        signatureId: event.signatureId,
        message: REQUEST_ID,
      }))

    it('settles on a later valid attestation instead of terminalizing on an early invalid one', async () => {
      fakeReader.fetchCheckState.mockResolvedValue(baseRead({ events: pair() }))
      verifyBy({
        [EARLY_SIG]: AttestationVerificationStatus.INVALID,
        [LATE_SIG]: AttestationVerificationStatus.VERIFIED,
      })

      const result = await runQuery(makeTestStore())

      expect(result.data?.status).toBe(CheckStatus.BENIGN)
      expect(result.data?.attestation.signatureId).toBe(LATE_SIG)
      // Stopped at the first signature that verified — the invalid one is never read.
      expect(fakeReader.verifyAttestation).toHaveBeenCalledTimes(1)
      expect(fakeReader.blockTimeMs).toHaveBeenCalledWith(200)
    })

    it('settles on the earlier valid attestation when the later one is invalid', async () => {
      fakeReader.fetchCheckState.mockResolvedValue(baseRead({ events: pair() }))
      verifyBy({
        [EARLY_SIG]: AttestationVerificationStatus.VERIFIED,
        [LATE_SIG]: AttestationVerificationStatus.INVALID,
      })

      const result = await runQuery(makeTestStore())

      expect(result.data?.status).toBe(CheckStatus.BENIGN)
      expect(result.data?.attestation.signatureId).toBe(EARLY_SIG)
      expect(fakeReader.verifyAttestation).toHaveBeenCalledTimes(2)
      expect(fakeReader.blockTimeMs).toHaveBeenCalledWith(100)
    })

    it('fails verification only when no attestation verifies', async () => {
      fakeReader.fetchCheckState.mockResolvedValue(baseRead({ events: pair() }))
      verifyBy({
        [EARLY_SIG]: AttestationVerificationStatus.INVALID,
        [LATE_SIG]: AttestationVerificationStatus.INVALID,
      })

      const result = await runQuery(makeTestStore())

      expect(result.data?.status).toBe(CheckStatus.VERIFICATION_FAILED)
      expect(fakeReader.verifyAttestation).toHaveBeenCalledTimes(2)
    })

    it('keeps a retryable result over a terminal one when nothing verifies', async () => {
      fakeReader.fetchCheckState.mockResolvedValue(baseRead({ events: pair() }))
      verifyBy({
        [EARLY_SIG]: AttestationVerificationStatus.PENDING,
        [LATE_SIG]: AttestationVerificationStatus.INVALID,
      })

      const result = await runQuery(makeTestStore())

      expect(result.data?.status).toBe(CheckStatus.AWAITING_VERIFICATION)
      expect(result.data?.attestation.signatureId).toBe(EARLY_SIG)
    })
  })

  describe('attestation binding', () => {
    beforeEach(() =>
      fakeReader.verifyAttestation.mockResolvedValue({
        status: AttestationVerificationStatus.VERIFIED,
        signatureId: REQUEST_ID,
        message: REQUEST_ID,
      }),
    )

    it('accepts an attestation naming the Safe being viewed', async () => {
      fakeReader.fetchCheckState.mockResolvedValue(baseRead({ events: [plainAttestedEvent({ ...BOUND })] }))

      const result = await runQuery(makeTestStore())

      expect(result.data?.status).toBe(CheckStatus.BENIGN)
    })

    it('reads an attestation for another chain as no attestation at all', async () => {
      // Safe <=1.2.0 omits the chain id from its domain hash, so one safeTxHash
      // can carry a sibling chain's attestation. It proves nothing here.
      const foreign = plainAttestedEvent({ chainId: '1', safe: SAFE })
      fakeReader.fetchCheckState.mockResolvedValue(baseRead({ events: [foreign] }))

      const result = await runQuery(makeTestStore())

      expect(fakeReader.verifyAttestation).not.toHaveBeenCalled()
      expect(result.data?.status).toBe(CheckStatus.UNAVAILABLE)
      expect(result.data?.attestation).toEqual(UNVERIFIED_ATTESTATION)
      expect(result.data?.events).toEqual([])
    })

    it('reads an attestation for another Safe as no attestation at all', async () => {
      const foreign = plainAttestedEvent({ chainId: CHAIN_ID, safe: '0x00000000000000000000000000000000000000ff' })
      fakeReader.fetchCheckState.mockResolvedValue(baseRead({ events: [foreign] }))

      const result = await runQuery(makeTestStore())

      expect(fakeReader.verifyAttestation).not.toHaveBeenCalled()
      expect(result.data?.status).toBe(CheckStatus.UNAVAILABLE)
    })

    it('falls through to the proposal state instead of failing on an unbound attestation', async () => {
      // The dangerous direction: an unbound attestation must not read as a
      // verdict, and must not terminalize the check either.
      fakeReader.fetchCheckState.mockResolvedValue(
        baseRead({
          events: [plainProposedEvent({ ...BOUND }), plainAttestedEvent({ chainId: '1', safe: SAFE })],
        }),
      )

      const result = await runQuery(makeTestStore())

      expect(result.data?.status).toBe(CheckStatus.SUBMITTED)
    })

    it('matches the Safe address case-insensitively', async () => {
      fakeReader.fetchCheckState.mockResolvedValue(
        baseRead({ events: [plainAttestedEvent({ chainId: CHAIN_ID, safe: SAFE.toUpperCase().replace('0X', '0x') })] }),
      )

      const result = await runQuery(makeTestStore())

      expect(result.data?.status).toBe(CheckStatus.BENIGN)
    })
  })
})
