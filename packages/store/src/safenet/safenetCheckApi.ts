import { createApi } from '@reduxjs/toolkit/query/react'
import {
  AttestationVerificationStatus,
  UNVERIFIED_ATTESTATION,
  bindAttestations,
  deriveCheckState,
  getSafenetReader,
  isEvidenceComplete,
  type AttestationCandidate,
  type AttestationVerification,
  type CheckReadResult,
  type RequestRead,
  type RequestSnapshot,
  type SafenetCheckSnapshot,
  type SafenetReader,
} from '@safe-global/utils/features/safenet-checks'
import { checkKey, type CheckIdentity } from './checkIdentity'
import { forgetAim, resolveAim } from './safenetAimRegistry'

/**
 * Standalone chain-reading API for Safenet checks — no HTTP endpoint, the work
 * happens in a custom `queryFn` (the ofac.ts pattern): read the chain, bind the
 * requests to the viewed Safe, verify each request's own attestation, run the
 * status machine. A successful poll replaces the snapshot as a unit; a failure
 * returns `{ error }` and RTK Query keeps serving the last complete snapshot.
 */
const noopBaseQuery = async () => ({ data: null })

/** How much a verification result is worth when no candidate verifies. */
const VERIFICATION_RANK: Record<AttestationVerificationStatus, number> = {
  [AttestationVerificationStatus.VERIFIED]: 3,
  // Retryable, so it outranks the terminal INVALID.
  [AttestationVerificationStatus.PENDING]: 2,
  [AttestationVerificationStatus.INVALID]: 1,
  [AttestationVerificationStatus.UNVERIFIED]: 0,
}

type SelectedAttestation = { candidate: AttestationCandidate; attestation: AttestationVerification }

/**
 * Verify one request's candidates in order and stop at the first signature that
 * verifies. An attestation that does not verify is only this request's result
 * when no other one does, so the strongest result wins rather than the earliest.
 * A verification only counts when it answered this request's own question: its
 * message must be the request id and its signature id the candidate's.
 */
const selectAttestation = async (
  reader: SafenetReader,
  candidates: ReadonlyArray<AttestationCandidate>,
): Promise<SelectedAttestation | null> => {
  let best: SelectedAttestation | null = null
  for (const candidate of candidates) {
    const result = await reader.verifyAttestation(candidate.input)
    const answered = result.message === candidate.requestId && result.signatureId === candidate.input.signatureId
    const attestation: AttestationVerification =
      result.status === AttestationVerificationStatus.VERIFIED && !answered
        ? { ...result, status: AttestationVerificationStatus.INVALID }
        : result
    if (best === null || VERIFICATION_RANK[attestation.status] > VERIFICATION_RANK[best.attestation.status]) {
      best = { candidate, attestation }
    }
    if (attestation.status === AttestationVerificationStatus.VERIFIED) break
  }
  return best
}

/**
 * Attach a request's own verification. Only a real attested log is dated; a
 * getter-only attestation has no block to date, and a failed header read keeps
 * the date null without suppressing the signature evidence.
 */
const snapshotRequest = async (
  reader: SafenetReader,
  request: RequestRead,
  candidates: ReadonlyArray<AttestationCandidate>,
): Promise<RequestSnapshot> => {
  const selected = await selectAttestation(
    reader,
    candidates.filter((candidate) => candidate.requestId === request.requestId),
  )
  if (!selected) return { ...request, attestation: UNVERIFIED_ATTESTATION, attestedEvent: null, attestedAtMs: null }
  const { event } = selected.candidate
  return {
    ...request,
    attestation: selected.attestation,
    attestedEvent: event,
    attestedAtMs: event ? await reader.blockTimeMs(event.blockNumber) : null,
  }
}

type DecidingFields = Pick<SafenetCheckSnapshot, 'epoch' | 'oracle' | 'deadlineBlock' | 'attestation' | 'attestedAtMs'>

const NO_DECIDING_REQUEST: DecidingFields = {
  epoch: null,
  oracle: null,
  deadlineBlock: null,
  attestation: UNVERIFIED_ATTESTATION,
  attestedAtMs: null,
}

/** The snapshot fields that describe the deciding request. Its deadline is arbitration when disputed, else reveal. */
const decidingFields = (request: RequestSnapshot | undefined): DecidingFields =>
  request
    ? {
        epoch: request.epoch,
        oracle: request.oracle,
        deadlineBlock: request.outcome === 'DISPUTED' ? request.arbitrationDeadlineBlock : request.revealDeadlineBlock,
        attestation: request.attestation,
        attestedAtMs: request.attestedAtMs,
      }
    : NO_DECIDING_REQUEST

/** One snapshot whose every request-scoped field belongs to the single deciding request. */
const assembleSnapshot = (input: {
  read: CheckReadResult
  events: SafenetCheckSnapshot['events']
  requests: RequestSnapshot[]
  aimedAtMs: number | null
}): SafenetCheckSnapshot => {
  const { read, events, requests, aimedAtMs } = input
  const decision = deriveCheckState({ requests })
  return {
    safeTxHash: read.safeTxHash,
    chainId: read.chainId,
    status: decision.status,
    outcome: decision.outcome,
    requestId: decision.requestId,
    ...decidingFields(requests.find((request) => request.requestId === decision.requestId)),
    headBlock: read.headBlock,
    headAtMs: read.headAtMs,
    observedAtMs: Date.now(),
    aimedAtMs,
    windowCoverage: read.windowCoverage,
    requests,
    evidenceComplete: isEvidenceComplete(requests, read.windowCoverage),
    events,
  }
}

/**
 * `chainId` and `safeAddress` are the Safe the check is being viewed for; a
 * request or attestation that does not name them is not this check's evidence.
 * There is deliberately no timestamp here: every surface rendering one check
 * shares this entry, so the read window is aimed through the aim registry, which
 * keeps the earliest submission time any surface offered.
 */
export const safenetCheckApi = createApi({
  reducerPath: 'safenetCheckApi',
  baseQuery: noopBaseQuery,
  endpoints: (builder) => ({
    getSafenetCheck: builder.query<SafenetCheckSnapshot, CheckIdentity>({
      async queryFn(identity, { getState }): Promise<{ data: SafenetCheckSnapshot } | { error: { message: string } }> {
        try {
          const target = { chainId: identity.chainId, safeAddress: identity.safeAddress }
          const reader = getSafenetReader()
          // Read at execution time, so every poll replays the best aim known
          // then — never the timestamp of whichever surface subscribed first.
          const aimedAtMs = resolveAim(identity)
          // The last complete snapshot carries the requests to refresh and the head to not fall behind.
          // The selector reads only this API's own slice of the root state.
          const previous = safenetCheckApi.endpoints.getSafenetCheck.select(identity)(getState() as never).data
          const read = await reader.fetchCheckState(identity.safeTxHash, {
            target,
            timestampMs: aimedAtMs,
            knownRequests: previous?.requests,
            minimumBlock: previous?.headBlock == null ? undefined : Number(previous.headBlock),
          })

          const bound = bindAttestations(read, target)
          const requests: RequestSnapshot[] = []
          for (const request of bound.requests) {
            requests.push(await snapshotRequest(reader, request, bound.candidates))
          }
          return { data: assembleSnapshot({ read, events: bound.events, requests, aimedAtMs }) }
        } catch (error) {
          // Kept Redux-serializable; the hook only needs the failure signal.
          return { error: { message: error instanceof Error ? error.message : String(error) } }
        }
      },
      // The check's identity is the Safe plus the hash, and `checkKey`
      // normalizes the Safe address case, so two spellings of one Safe cannot
      // open two entries and two poll loops.
      serializeQueryArgs: ({ endpointName, queryArgs }) => `${endpointName}(${checkKey(queryArgs)})`,
      // Frees the aim with the entry it aims: once the last subscriber is gone
      // and the entry is evicted, a later mount rebuilds the aim from its own
      // offer. Not exact parity — an aim recorded by a discarded render never
      // opened an entry, so nothing forgets it (see the registry doc).
      async onCacheEntryAdded(identity, { cacheEntryRemoved }) {
        await cacheEntryRemoved
        forgetAim(identity)
      },
      keepUnusedDataFor: 300,
    }),
  }),
})

export const { useGetSafenetCheckQuery } = safenetCheckApi
