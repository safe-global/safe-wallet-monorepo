import useSimilarityClusters from './useSimilarityClusters'

/**
 * {@link useSimilarityClusters} without the cluster ids — for surfaces that only need per-row
 * badges (no grouping). Pass a referentially-stable `addresses` array.
 */
const useFlaggedSimilarAddresses = (addresses: string[]): Set<string> => useSimilarityClusters(addresses).flagged

export default useFlaggedSimilarAddresses
