import { createContext } from 'react'
import type { SafeScopeTarget } from '@safe-global/views/components/tx-flow/safe-scope/types'
import type { TxModalContextType } from '@/components/tx-flow'

export type ScopedTxFlowOpener = (target: SafeScopeTarget, ...args: Parameters<TxModalContextType['setTxFlow']>) => void

/** Lets a page open scoped callers' flows its own way (e.g. on the URL Safe) instead of wrapping them in a SafeScope */
export const ScopedTxFlowOpenerContext = createContext<ScopedTxFlowOpener | undefined>(undefined)
