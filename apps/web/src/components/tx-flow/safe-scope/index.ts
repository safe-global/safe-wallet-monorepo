// `SafeScopeProvider` is deliberately NOT re-exported here: it imports the protocol-kit SDK
// initialiser, and always-loaded modules (hooks, tx-sender) import this barrel's light parts.
// Mount sites import it directly from './SafeScopeProvider'.
export { SafeScopeContext, useSafeScope, useSafeScopeControls } from './context'
export { buildSafeScopeKey, parseSafeScopeKey } from './utils'
export { hasActiveScope, registerActiveScope } from './activeScope'
export type {
  SafeScope,
  SafeScopeKey,
  SafeScopeTarget,
  SafeScopeControls,
  SafeScopeContextValue,
  TxSenderScope,
} from './types'
