import { createContext, useContext } from 'react'
import type { SafeScopeTarget } from '@safe-global/views/components/tx-flow/safe-scope/types'

/** The Safe a scoped tx flow acts on, for the topbar to show locked (the modal renders outside its scope). */
export const TxFlowSafeContext = createContext<SafeScopeTarget | undefined>(undefined)

/** Set only around the tx modal's flow, and reset by the first scope inside it, so only the flow's own scope reports. */
export const TxFlowSafeReporterContext = createContext<((target: SafeScopeTarget | undefined) => void) | undefined>(
  undefined,
)

export const useTxFlowSafe = (): SafeScopeTarget | undefined => useContext(TxFlowSafeContext)
