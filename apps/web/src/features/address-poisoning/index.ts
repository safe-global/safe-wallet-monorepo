/**
 * Address-poisoning protection — public API.
 *
 * Detects when an address a user is about to use dangerously resembles an address
 * they explicitly trust (anchors: local address book, pinned/trusted Safes, curated
 * nested Safes, undeployed Safes). The check surfaces inside Copilot's recipient
 * card (see features/safe-shield/hooks/useRecipientAnalysisWithPoisoning).
 * Gated by the ADDRESS_POISONING_PROTECTION chain feature flag.
 */
export { selectAnchorIndex, selectAnchorAddresses } from './store'
