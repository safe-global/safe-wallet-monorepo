/**
 * Lightweight, eagerly-importable helpers for the spaces feature.
 *
 * Anything here must stay cheap: it is imported directly rather than through
 * `useLoadFeature`, so it must not pull in React components or heavy dependencies.
 */
export {
  canDecodePolicyTx,
  decodeConfigurations,
  decodeConfigureRoot,
  decodePolicyPayload,
  isClearedCosigner,
  isPolicyTxMethod,
  policyTxMethodOf,
  POLICY_TX_METHODS,
  type PolicyPayload,
  type PolicyTxMethod,
} from './policyTx'
