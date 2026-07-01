/**
 * Address-poisoning protection — public API.
 *
 * Detects when an address a user is about to use/save/view dangerously resembles
 * an address they explicitly trust (anchors), and surfaces a warning / gate.
 * Gated by the ADDRESS_POISONING_PROTECTION chain feature flag.
 */
export { default as useAddressSimilarity } from './hooks/useAddressSimilarity'
export { default as useAddressPoisoningGuard } from './hooks/useAddressPoisoningGuard'
export type { GuardContext, BlockedHint } from './hooks/useAddressPoisoningGuard'
export { default as AddressPoisoningGuard } from './components/AddressPoisoningGuard'
export type { AddressPoisoningGuardProps } from './components/AddressPoisoningGuard'
export { default as GuardBlockedHint } from './components/GuardBlockedHint'
