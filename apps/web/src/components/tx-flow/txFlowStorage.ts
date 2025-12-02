import { sessionItem } from '@/services/local-storage/session'
import type { ReactElement } from 'react'

const TX_FLOW_STORAGE_KEY = 'txFlowState_v1'

export type SerializedTxFlowState<T = any> = {
  flowType: string
  step: number
  data: T
  txId?: string
  txNonce?: number
  timestamp: number
}

const txFlowStorage = sessionItem<SerializedTxFlowState>(TX_FLOW_STORAGE_KEY)

/**
 * Save transaction flow state to session storage
 * This allows users to reload the page and resume their transaction flow
 */
export const saveTxFlowState = <T>(flowType: string, step: number, data: T, txId?: string, txNonce?: number) => {
  const state: SerializedTxFlowState<T> = {
    flowType,
    step,
    data,
    txId,
    txNonce,
    timestamp: Date.now(),
  }

  txFlowStorage.set(state)
}

/**
 * Load transaction flow state from session storage
 * Returns null if no state exists or if the state is stale (>1 hour old)
 */
export const loadTxFlowState = <T = any>(): SerializedTxFlowState<T> | null => {
  const state = txFlowStorage.get()

  if (!state) {
    return null
  }

  // Clear stale state (older than 1 hour)
  const ONE_HOUR = 60 * 60 * 1000
  if (Date.now() - state.timestamp > ONE_HOUR) {
    clearTxFlowState()
    return null
  }

  return state as SerializedTxFlowState<T>
}

/**
 * Clear transaction flow state from session storage
 */
export const clearTxFlowState = () => {
  txFlowStorage.remove()
}

/**
 * Get the flow type identifier from a React element
 * This is used to match the saved state with the current flow
 */
export const getFlowType = (txFlow: ReactElement | undefined): string | null => {
  if (!txFlow) return null

  // Use the component's displayName or name as the flow type
  const componentType = txFlow.type as any
  return componentType.displayName || componentType.name || null
}
