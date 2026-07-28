import { createApi } from '@reduxjs/toolkit/query/react'
import {
  CheckEventType,
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
 * Standalone chain-reading API for Safenet checks. There is no HTTP endpoint —
 * the work happens in a custom `queryFn` (the ofac.ts pattern): read the chain,
 * verify the attestation if one is present, run the status machine, merge against
 * the session-pinned verdict, and pin forward on a rank increase. A fetch failure
 * returns `{ error }`; RTK Query keeps serving the last good snapshot.
 */
const noopBaseQuery = async () => ({ data: null })

/**
 * Query arg. `timestampMs` is when the Safe transaction happened; supplying it
 * lets the reader target a narrow block window instead of scanning back from the
 * head, which keeps the read cost constant however old the check is.
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

          // Prefer the oracle attestation when both are present — it is the one
          // backed by sentinel checks. The reader derives each path's EIP-712
          // preimage from the event itself, so the two can never be crossed.
          const attestedEvent = read.events.find(
            (event): event is OracleAttestedEvent | PlainAttestedEvent =>
              event.type === CheckEventType.ORACLE_ATTESTED || event.type === CheckEventType.PLAIN_ATTESTED,
          )
          const attestation: AttestationVerification = attestedEvent
            ? await reader.verifyAttestation(attestedEvent)
            : UNVERIFIED_ATTESTATION

          const derived = deriveCheckState({ events: read.events, attestation, headBlock: read.headBlock })
          const pinned = selectPinnedVerdict(getState() as SafenetCheckPartialState, safeTxHash)
          const status = mergeMonotonic(pinned?.status, derived)

          // mergeMonotonic only ever advances forward, so a changed status is a
          // rank increase — pin it as the new session floor.
          if (status !== pinned?.status) {
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
          // Keep the error Redux-serializable — the hook only needs the failure
          // signal to map the snapshot to UNAVAILABLE; RTK Query retains the last
          // good data across the failure.
          return { error: { message: error instanceof Error ? error.message : String(error) } }
        }
      },
      // `timestampMs` only aims the block window — the check's identity is its
      // hash. Without this, the same check rendered with a submission date and
      // later an execution date would open a second cache entry and a second
      // poll loop.
      serializeQueryArgs: ({ endpointName, queryArgs }) => `${endpointName}(${queryArgs.safeTxHash})`,
      keepUnusedDataFor: 300,
    }),
  }),
})

export const { useGetSafenetCheckQuery } = safenetCheckApi
