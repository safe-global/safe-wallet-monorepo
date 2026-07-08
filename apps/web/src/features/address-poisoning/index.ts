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
export { default as useSelectionSimilarities, INTRA_LIST_MATCH } from './hooks/useSelectionSimilarities'
export type { SelectionSimilarity } from './hooks/useSelectionSimilarities'
export { default as useSimilarityGroups } from './hooks/useSimilarityGroups'
