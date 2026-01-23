import { useContext } from 'react'
import { TxModalContext } from '@/features/tx-flow/TxModalProvider'
import type { TxModalContextType } from '../types'

/**
 * Hook to access the TxModalContext for opening/closing transaction flows.
 *
 * @returns TxModalContextType with setTxFlow to open flows
 *
 * @example
 * ```typescript
 * import { useTxFlow } from '@/features/tx-flow'
 *
 * function MyComponent() {
 *   const { setTxFlow } = useTxFlow()
 *   return (
 *     <button onClick={() => setTxFlow(<TokenTransferFlow />)}>
 *       Send
 *     </button>
 *   )
 * }
 * ```
 */
export function useTxFlow(): TxModalContextType {
  return useContext(TxModalContext)
}
