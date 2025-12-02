import type { ComponentType } from 'react'
import { TxFlowType } from '@/services/analytics'

// Lazy imports to avoid circular dependencies and improve initial load time
const flowRegistry: Record<string, () => Promise<{ default: ComponentType<any> }>> = {
  [TxFlowType.TOKEN_TRANSFER]: () => import('./flows/TokenTransfer'),
  [TxFlowType.NFT_TRANSFER]: () => import('./flows/NftTransfer'),
  [TxFlowType.ADD_OWNER]: () => import('./flows/AddOwner'),
  [TxFlowType.REMOVE_OWNER]: () => import('./flows/RemoveOwner'),
  [TxFlowType.REPLACE_OWNER]: () => import('./flows/ReplaceOwner'),
  [TxFlowType.CHANGE_THRESHOLD]: () => import('./flows/ChangeThreshold'),
  [TxFlowType.REMOVE_MODULE]: () => import('./flows/RemoveModule'),
  [TxFlowType.REMOVE_GUARD]: () => import('./flows/RemoveGuard'),
  [TxFlowType.REMOVE_SPENDING_LIMIT]: () => import('./flows/RemoveSpendingLimit'),
  [TxFlowType.SETUP_SPENDING_LIMIT]: () => import('./flows/NewSpendingLimit'),
  [TxFlowType.SIGNERS_STRUCTURE]: () => import('./flows/ManagerSigners'),
  [TxFlowType.CONFIRM_TX]: () => import('./flows/ConfirmTx'),
  [TxFlowType.REJECT_TX]: () => import('./flows/RejectTx'),
  [TxFlowType.CONFIRM_BATCH]: () => import('./flows/ConfirmBatch'),
  [TxFlowType.UPDATE_SAFE]: () => import('./flows/UpdateSafe'),
  [TxFlowType.SIGN_MESSAGE_ON_CHAIN]: () => import('./flows/SignMessageOnChain'),
  [TxFlowType.SETUP_RECOVERY]: () => import('./flows/UpsertRecovery'),
  [TxFlowType.REMOVE_RECOVERY]: () => import('./flows/RemoveRecovery'),
  [TxFlowType.CANCEL_RECOVERY]: () => import('./flows/CancelRecovery'),
}

/**
 * Load a flow component by its type identifier
 * Returns the flow component or null if not found/failed to load
 */
export const loadFlowByType = async (flowType: string): Promise<ComponentType<any> | null> => {
  const loader = flowRegistry[flowType]
  if (!loader) {
    console.warn(`[Flow Registry] No flow registered for type: ${flowType}`)
    return null
  }

  try {
    const flowModule = await loader()
    return flowModule.default
  } catch (error) {
    console.error(`[Flow Registry] Failed to load flow ${flowType}:`, error)
    return null
  }
}
