import { createApi } from '@reduxjs/toolkit/query/react'
import {
  CheckEventType,
  CheckStatus,
  UNVERIFIED_ATTESTATION,
  deriveCheckState,
  getSafenetReader,
  mergeMonotonic,
  type AttestationVerification,
  type OracleAttestedEvent,
  type PlainAttestedEvent,
  type SafenetCheckSnapshot,
} from '@safe-global/utils/features/safenet-checks'
import { pinVerdict, selectPinnedVerdict, type SafenetCheckPartialState } from './safenetCheckSlice'

/**
 * Standalone chain-reading API for Safenet checks — no HTTP endpoint, the work
 * happens in a custom `queryFn` (the ofac.ts pattern): read the chain, verify
 * the attestation, run the status machine, merge against the session-pinned
 * verdict. A fetch failure returns `{ error }`; RTK Query keeps serving the
 * last good snapshot.
 */
const noopBaseQuery = async () => ({ data: null })

/**
 * `timestampMs` is when the Safe transaction was submitted (proposal time, not
 * execution time — checks are proposed around the first signature) and only
 * aims the reader's block window. All callers of one hash share a cache entry,
 * so the semantic has to stay canonical. See `serializeQueryArgs` below.
 */
export type SafenetCheckArg = {
  safeTxHash: string
  timestampMs?: number | null
}

export const safenetCheckApi = createApi({
  reducerPath: 'safenetCheckApi',
  baseQuery: noopBaseQuery,
  endpoints: (builder) => ({
    getSafenetCheck: builder.query<SafenetCheckSnapshot, SafenetCheckArg>({
      async queryFn({ safeTxHash, timestampMs }, { getState, dispatch }) {
        try {
          const reader = getSafenetReader()
          const read = await reader.fetchCheckState(safeTxHash, { timestampMs })

          // Prefer the oracle attestation when both are present: it is the one
          // backed by sentinel checks, and deriveCheckState consumes the
          // verification result through its oracle branch first. Plain
          // events.find would verify whichever attested first on chain.
          const attestedEvent =
            read.events.find((event): event is OracleAttestedEvent => event.type === CheckEventType.ORACLE_ATTESTED) ??
            read.events.find((event): event is PlainAttestedEvent => event.type === CheckEventType.PLAIN_ATTESTED)
          const attestation: AttestationVerification = attestedEvent
            ? await reader.verifyAttestation(attestedEvent)
            : UNVERIFIED_ATTESTATION

          const derived = deriveCheckState({ events: read.events, attestation, headBlock: read.headBlock })
          const pinned = selectPinnedVerdict(getState() as SafenetCheckPartialState, safeTxHash)
          const status = mergeMonotonic(pinned?.status, derived)

          // mergeMonotonic only advances, so a changed status is a rank
          // increase — pin it as the new session floor. UNAVAILABLE is not a
          // verdict and would grow the slice by one inert entry per rendered row.
          if (status !== pinned?.status && status !== CheckStatus.UNAVAILABLE) {
            dispatch(pinVerdict({ safeTxHash, status, atBlock: read.headBlock, verification: attestation }))
          }

          const snapshot: SafenetCheckSnapshot = {
            safeTxHash: read.safeTxHash,
            chainId: read.chainId,
            status,
            generation: read.generation,
            requestId: read.requestId,
            epoch: read.epoch,
            oracle: read.oracle,
            deadlineBlock: read.deadlineBlock,
            headBlock: read.headBlock,
            attestation,
            events: read.events,
          }
          return { data: snapshot }
        } catch (error) {
          // Kept Redux-serializable; the hook only needs the failure signal.
          return { error: { message: error instanceof Error ? error.message : String(error) } }
        }
      },
      // `timestampMs` only aims the block window — the check's identity is its
      // hash. Without this, two renderings of the same check with different
      // timestamps would open a second cache entry and a second poll loop.
      serializeQueryArgs: ({ endpointName, queryArgs }) => `${endpointName}(${queryArgs.safeTxHash})`,
      keepUnusedDataFor: 300,
    }),
  }),
})

export const { useGetSafenetCheckQuery } = safenetCheckApi
