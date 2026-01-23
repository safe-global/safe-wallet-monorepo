/**
 * tx-flow feature - Transaction flow management for Safe{Wallet}
 *
 * This feature provides:
 * - TxModalProvider: Provider for the transaction modal system
 * - TxFlow: Core wrapper for transaction flows
 * - 33 individual flow components (TokenTransfer, AddOwner, etc.)
 * - useTxFlow: Hook to open/close transaction flows
 *
 * @example
 * ```typescript
 * import { TxFlowFeature } from '@/features/tx-flow'
 * import { useLoadFeature } from '@/features/__core__'
 *
 * function MyComponent() {
 *   const txFlow = useLoadFeature(TxFlowFeature)
 *   if (!txFlow) return null
 *
 *   const { setTxFlow } = txFlow.hooks.useTxFlow()
 *   return (
 *     <button onClick={() => setTxFlow(<txFlow.components.TokenTransferFlow />)}>
 *       Send
 *     </button>
 *   )
 * }
 * ```
 */

// Feature handle export (use with useLoadFeature)
export { txFlowHandle as TxFlowFeature } from './handle'

// Contract types
export type { TxFlowContract, TxFlowImplementation, TxFlowComponents, TxFlowHooks } from './contract'

// Public types
export type {
  TxModalContextType,
  TxFlowContextType,
  SubmitCallback,
  SubmitCallbackWithData,
  SubmitCallbackProps,
} from './types'

// Direct hook export for convenience (doesn't require useLoadFeature)
export { useTxFlow } from './hooks/useTxFlow'

// TokenTransfer flow types (from lightweight types file, not the component)
export {
  TokenTransferType,
  TokenTransferFields,
  MultiTokenTransferFields,
} from './components/flows/TokenTransfer/types'
export type {
  TokenTransferParams,
  MultiTokenTransferParams,
} from './components/flows/TokenTransfer/types'

// ============================================================
// COMPONENTS & PROVIDERS
// Direct exports for convenience (part of public API)
// ============================================================

// TxModalProvider and Context - used in _app.tsx and throughout the app
export { TxModalContext, TxModalProvider } from './TxModalProvider'

// All flow components - public API for easy imports
export {
  AddOwnerFlow,
  CancelRecoveryFlow,
  ChangeThresholdFlow,
  ConfirmBatchFlow,
  ConfirmTxFlow,
  CreateNestedSafeFlow,
  ExecuteBatchFlow,
  ManageSignersFlow,
  MigrateSafeL2Flow,
  NestedTxSuccessScreenFlow,
  NewSpendingLimitFlow,
  NewTxFlow,
  NftTransferFlow,
  RecoveryAttemptFlow,
  RecoverAccountFlow,
  RejectTxFlow,
  RemoveGuardFlow,
  RemoveModuleFlow,
  RemoveOwnerFlow,
  RemoveRecoveryFlow,
  RemoveSpendingLimitFlow,
  ReplaceOwnerFlow,
  ReplaceTxFlow,
  SafeAppsTxFlow,
  SignMessageFlow,
  SignMessageOnChainFlow,
  SuccessScreenFlow,
  TokenTransferFlow,
  UpdateSafeFlow,
  UpsertRecoveryFlow,
} from './components/flows'
