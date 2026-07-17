import useSimilarityClusters from './useSimilarityClusters'

/**
 * Flat set of addresses to flag as look-alikes, for the account/list display surfaces
 * (space onboarding, add-accounts, space safe-accounts, trusted-safes modal, nested safes).
 *
 * Thin wrapper over {@link useSimilarityClusters} that drops the cluster ids — use this where the
 * surface only needs per-row badges; use useSimilarityClusters where it also boxes look-alikes.
 *
 * Combines intra-list (union-find over shared front-4 OR back-4, always on) with the anchor detector
 * (resembles a trusted anchor, flag-gated). Pass a referentially-stable `addresses` array.
 */
const useFlaggedSimilarAddresses = (addresses: string[]): Set<string> => useSimilarityClusters(addresses).flagged

export default useFlaggedSimilarAddresses
