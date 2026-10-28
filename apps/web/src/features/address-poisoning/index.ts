/**
 * Address-poisoning protection — public API. Flags addresses that resemble ones the user trusts
 * (local anchors: address book, pinned/curated/undeployed Safes). Flag-gated by ADDRESS_POISONING_PROTECTION.
 */
export { selectAnchorIndex, selectAnchorAddresses } from './store'

export { default as useAddressPoisoningCheck, type SimilarSavedAddress } from './hooks/useAddressPoisoningCheck'
export { default as useAddressPoisoningBatchCheck } from './hooks/useAddressPoisoningBatchCheck'
export { default as useAnchorListMatches } from './hooks/useAnchorListMatches'
export { default as useSimilarityClusters } from './hooks/useSimilarityClusters'

export {
  bandGroupsForList,
  buildSimilarWarnings,
  type SimilarPeer,
  type SimilarWarning,
} from './utils/crossListClusters'
