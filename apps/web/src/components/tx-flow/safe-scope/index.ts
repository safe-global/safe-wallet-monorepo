// SPDX-License-Identifier: FSL-1.1-MIT

export { SafeScopeContext, useSafeScope, useSafeScopeControls } from './context'
export { SafeScopeProvider } from './SafeScopeProvider'
export { buildSafeScopeKey, parseSafeScopeKey } from './utils'
export { hasActiveScope, registerActiveScope } from './activeScope'
export type { SafeScope, SafeScopeTarget, SafeScopeControls, SafeScopeContextValue, TxSenderScope } from './types'
