import { createContext, useContext } from 'react'
import type { SafeScopeTarget } from '@safe-global/views/components/tx-flow/safe-scope/types'

/**
 * The Safe the open tx flow acts on when a `SafeScopeProvider` (not the URL) supplies it, e.g. a flow
 * opened from the Workspace. The modal renders at the app root, so the topbar can't read the scope
 * directly; it reads this instead to show that Safe, locked, in its Safe bar.
 */
export const TxFlowSafeContext = createContext<SafeScopeTarget | undefined>(undefined)

/**
 * Provided by the tx modal around its flow only, so a scope mounted anywhere else on the page (e.g. a
 * row of the Workspace queue) never reports. The first scope inside the flow resets it for its
 * children, so a nested scope can't override the flow's Safe.
 */
export const TxFlowSafeReporterContext = createContext<((target: SafeScopeTarget | undefined) => void) | undefined>(
  undefined,
)

export const useTxFlowSafe = (): SafeScopeTarget | undefined => useContext(TxFlowSafeContext)
