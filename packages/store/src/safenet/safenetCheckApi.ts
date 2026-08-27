import { createApi } from '@reduxjs/toolkit/query/react'
import {
  AttestationVerificationStatus,
  CheckStatus,
  UNVERIFIED_ATTESTATION,
  bindAttestations,
  deriveCheckState,
  getSafenetReader,
  mergeMonotonic,
  type AttestationVerification,
  type AttestedCheckEvent,
  type SafenetCheckSnapshot,
  type SafenetReader,
} from '@safe-global/utils/features/safenet-checks'
import {
  checkKey,
  pinVerdict,
  selectPinnedVerdict,
  type CheckIdentity,
  type SafenetCheckPartialState,
} from './safenetCheckSlice'
import { forgetAim, resolveAim } from './safenetAimRegistry'

/**
 * Standalone chain-reading API for Safenet checks — no HTTP endpoint, the work
 * happens in a custom `queryFn` (the ofac.ts pattern): read the chain, verify
 * the attestation, run the status machine, merge against the session-pinned
 * verdict. A fetch failure returns `{ error }`; RTK Query keeps serving the
 * last good snapshot.
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

type SelectedAttestation = { event: AttestedCheckEvent; attestation: AttestationVerification }

/**
 * Verify candidates in order and stop at the first signature that verifies. An
 * attestation that does not verify is only this check's verdict when no other
 * one does, so the strongest result wins rather than the earliest.
 */
const selectAttestation = async (
  reader: SafenetReader,
  candidates: ReadonlyArray<AttestedCheckEvent>,
): Promise<SelectedAttestation | null> => {
  let best: SelectedAttestation | null = null
  for (const event of candidates) {
    const attestation = await reader.verifyAttestation(event)
    if (best === null || VERIFICATION_RANK[attestation.status] > VERIFICATION_RANK[best.attestation.status]) {
      best = { event, attestation }
    }
    if (attestation.status === AttestationVerificationStatus.VERIFIED) break
  }
  return best
}

/**
 * `chainId` and `safeAddress` are the Safe the check is being viewed for; an
 * attestation that does not name them is not this check's evidence. There is
 * deliberately no timestamp here: every surface rendering one check shares this
 * entry, so the read window is aimed through the aim registry, which keeps the
 * earliest submission time any surface offered.
 */
export const safenetCheckApi = createApi({
  reducerPath: 'safenetCheckApi',
  baseQuery: noopBaseQuery,
  endpoints: (builder) => ({
    getSafenetCheck: builder.query<SafenetCheckSnapshot, CheckIdentity>({
      async queryFn(identity, { getState, dispatch }) {
        const { safeTxHash, chainId, safeAddress } = identity
        try {
          const reader = getSafenetReader()
          // Read at execution time, so every poll replays the best aim known
          // then — never the timestamp of whichever surface subscribed first.
          const aimedAtMs = resolveAim(identity)
          const read = await reader.fetchCheckState(safeTxHash, { timestampMs: aimedAtMs })

          const { events, candidates } = bindAttestations(read.events, { chainId, safeAddress })
          const selected = await selectAttestation(reader, candidates)
          // The header read only dates the audit step, and it is gated on an
          // attestation existing. Cost is one extra call per poll that observes
          // one — for a settled check that is one poll when the group key loads,
          // and every poll while it does not or while arbitration stays open.
          const [attestation, attestedAtMs]: [AttestationVerification, number | null] = selected
            ? [selected.attestation, await reader.blockTimeMs(selected.event.blockNumber)]
            : [UNVERIFIED_ATTESTATION, null]

          const derived = deriveCheckState({ events, attestation, headBlock: read.headBlock })
          const pinned = selectPinnedVerdict(getState() as SafenetCheckPartialState, identity)
          const status = mergeMonotonic(pinned?.status, derived)

          // mergeMonotonic only advances, so a changed status is a rank
          // increase — pin it as the new session floor. UNAVAILABLE is not a
          // verdict and would grow the slice by one inert entry per rendered row.
          if (status !== pinned?.status && status !== CheckStatus.UNAVAILABLE) {
            dispatch(pinVerdict({ ...identity, status, atBlock: read.headBlock, verification: attestation }))
          }

          const snapshot: SafenetCheckSnapshot = {
            safeTxHash: read.safeTxHash,
            chainId: read.chainId,
            status,
            requestId: read.requestId,
            epoch: read.epoch,
            oracle: read.oracle,
            deadlineBlock: read.deadlineBlock,
            headBlock: read.headBlock,
            attestation,
            attestedAtMs,
            aimedAtMs,
            windowCoverage: read.windowCoverage,
            events,
          }
          return { data: snapshot }
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
