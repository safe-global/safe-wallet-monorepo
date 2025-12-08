import type { ComponentType } from 'react'

// Lazy imports to avoid circular dependencies and improve initial load time
// Using string literals instead of enum to avoid Jest module resolution issues
const flowRegistry: Record<string, () => Promise<{ default: ComponentType<any> }>> = {
  'token-transfer': () => import('./flows/TokenTransfer'),
  'nft-transfer': () => import('./flows/NftTransfer'),
  'add-owner': () => import('./flows/AddOwner'),
  'remove-owner': () => import('./flows/RemoveOwner'),
  'replace-owner': () => import('./flows/ReplaceOwner'),
  'change-threshold': () => import('./flows/ChangeThreshold'),
  'remove-module': () => import('./flows/RemoveModule'),
  'remove-guard': () => import('./flows/RemoveGuard'),
  'remove-spending-limit': () => import('./flows/RemoveSpendingLimit'),
  'setup-spending-limit': () => import('./flows/NewSpendingLimit'),
  'signers-structure': () => import('./flows/ManagerSigners'),
  'confirm-tx': () => import('./flows/ConfirmTx'),
  'reject-tx': () => import('./flows/RejectTx'),
  'confirm-batch': () => import('./flows/ConfirmBatch'),
  'update-safe': () => import('./flows/UpdateSafe'),
  'sign-message-on-chain': () => import('./flows/SignMessageOnChain'),
  'setup-recovery': () => import('./flows/UpsertRecovery'),
  'remove-recovery': () => import('./flows/RemoveRecovery'),
  'cancel-recovery': () => import('./flows/CancelRecovery'),
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
