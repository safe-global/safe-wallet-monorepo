/**
 * Feature handle for the tx-flow feature.
 * This is always enabled since tx-flow is a core feature.
 */
import type { TxFlowImplementation } from './contract'

export interface TxFlowHandle {
  name: string
  useIsEnabled: () => boolean
  load: () => Promise<{ default: TxFlowImplementation }>
}

export const txFlowHandle: TxFlowHandle = {
  name: 'tx-flow',
  useIsEnabled: () => true, // Always enabled - core feature
  load: () => import('./feature'),
}
