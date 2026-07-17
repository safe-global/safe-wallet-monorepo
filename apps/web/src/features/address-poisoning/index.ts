/**
 * Address-poisoning protection — public API. Flags addresses that resemble ones the user trusts
 * (local anchors: address book, pinned/curated/undeployed Safes). Flag-gated by ADDRESS_POISONING_PROTECTION.
 */
export { selectAnchorIndex, selectAnchorAddresses } from './store'

// Mode B — list detection for account/list surfaces
export { default as useListSimilarities } from './hooks/useListSimilarities'
// Flat flagged-address set for display lists (intra-list always on + anchor flag-gated)
export { default as useFlaggedSimilarAddresses } from './hooks/useFlaggedSimilarAddresses'
// Flagged set + per-address cluster id, for surfaces that also box look-alikes together
export { default as useSimilarityClusters } from './hooks/useSimilarityClusters'
