/**
 * Address-poisoning protection — public API.
 *
 * Detects when an address a user is about to use/save/view dangerously resembles
 * an address they explicitly trust (anchors), and surfaces a warning / gate.
 * Gated by the ADDRESS_POISONING_PROTECTION chain feature flag.
 */
export { default as useAddressSimilarity } from './hooks/useAddressSimilarity'
export { default as useAddressSimilarityGate } from './hooks/useAddressSimilarityGate'
export type { AddressSimilarityGate } from './hooks/useAddressSimilarityGate'
export { default as useListSimilarities } from './hooks/useListSimilarities'
export { default as AddressSimilarityWarning } from './components/AddressSimilarityWarning'
export { default as SimilarAddressConfirmDialog } from './components/SimilarAddressConfirmDialog'
