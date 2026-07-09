/**
 * Address-poisoning protection — public API.
 *
 * Detects when an address a user is about to use dangerously resembles an address
 * they explicitly trust (anchors: local address book, pinned/trusted Safes, curated
 * nested Safes, undeployed Safes). The check surfaces inside Copilot's recipient
 * card (see features/safe-shield/hooks/useAddressPoisoningAnalysis).
 * Gated by the ADDRESS_POISONING_PROTECTION chain feature flag.
 */
export { selectAnchorIndex, selectAnchorAddresses } from './store'

// Mode B — list detection for account/list surfaces (existing dev UIs consume these)
export { default as useListSimilarities } from './hooks/useListSimilarities'
// Flat flagged-address set for display lists (intra-list always on + anchor flag-gated)
export { default as useFlaggedSimilarAddresses } from './hooks/useFlaggedSimilarAddresses'
// Anchor match/imitated split for the union-find grouping surfaces (trusted-safes modal, nested curation)
export { default as useAnchorMatches } from './hooks/useAnchorMatches'
export type { AnchorMatches } from './hooks/useAnchorMatches'
