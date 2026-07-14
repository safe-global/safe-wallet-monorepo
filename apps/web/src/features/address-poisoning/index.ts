/**
 * Address-poisoning protection — public API. Flags addresses that resemble ones the user trusts
 * (local anchors: address book, pinned/curated/undeployed Safes). Flag-gated by ADDRESS_POISONING_PROTECTION.
 */
export { selectAnchorIndex, selectAnchorAddresses } from './store'

// Mode B — list detection for account/list surfaces (existing dev UIs consume these)
export { default as useListSimilarities } from './hooks/useListSimilarities'
// Flat flagged-address set for display lists (intra-list always on + anchor flag-gated)
export { default as useFlaggedSimilarAddresses } from './hooks/useFlaggedSimilarAddresses'
// Anchor match/imitated split for the union-find grouping surfaces (trusted-safes modal, nested curation)
export { default as useAnchorMatches } from './hooks/useAnchorMatches'
export type { AnchorMatches } from './hooks/useAnchorMatches'
