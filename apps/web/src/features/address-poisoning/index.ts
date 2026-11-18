/**
 * Address-poisoning protection — public API. Flags addresses that resemble ones the user trusts
 * (local anchors: address book, pinned/curated/undeployed Safes). Flag-gated by ADDRESS_POISONING_PROTECTION.
 */
export { selectAnchorIndex, selectAnchorAddresses } from '@/features/address-poisoning/store/anchorIndex'

export { type SimilarSavedAddress } from './hooks/useAddressPoisoningCheck'

export { type SimilarPeer, type SimilarWarning } from './utils/crossListClusters'
