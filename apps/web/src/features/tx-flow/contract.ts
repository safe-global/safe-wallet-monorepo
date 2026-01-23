/**
 * Contract types for the tx-flow feature.
 * Defines the interface that the feature implementation must satisfy.
 */
import type { TxModalContextType, TxFlowContextType } from './types'

// Import flow component types (import type is erased at compile time - no bundle impact)
import type AddOwnerFlow from './components/flows/AddOwner'
import type CancelRecoveryFlow from './components/flows/CancelRecovery'
import type ChangeThresholdFlow from './components/flows/ChangeThreshold'
import type ConfirmBatchFlow from './components/flows/ConfirmBatch'
import type ConfirmTxFlow from './components/flows/ConfirmTx'
import type CreateNestedSafeFlow from './components/flows/CreateNestedSafe'
import type ExecuteBatchFlow from './components/flows/ExecuteBatch'
import type ManageSignersFlow from './components/flows/ManagerSigners'
import type MigrateSafeL2Flow from './components/flows/MigrateSafeL2'
import type NestedTxSuccessScreenFlow from './components/flows/NestedTxSuccessScreen'
import type NewSpendingLimitFlow from './components/flows/NewSpendingLimit'
import type NewTxFlow from './components/flows/NewTx'
import type NftTransferFlow from './components/flows/NftTransfer'
import type RecoveryAttemptFlow from './components/flows/RecoveryAttempt'
import type RecoverAccountFlow from './components/flows/RecoverAccount'
import type RejectTxFlow from './components/flows/RejectTx'
import type RemoveGuardFlow from './components/flows/RemoveGuard'
import type RemoveModuleFlow from './components/flows/RemoveModule'
import type RemoveOwnerFlow from './components/flows/RemoveOwner'
import type RemoveRecoveryFlow from './components/flows/RemoveRecovery'
import type RemoveSpendingLimitFlow from './components/flows/RemoveSpendingLimit'
import type ReplaceOwnerFlow from './components/flows/ReplaceOwner'
import type ReplaceTxFlow from './components/flows/ReplaceTx'
import type SafeAppsTxFlow from './components/flows/SafeAppsTx'
import type SignMessageFlow from './components/flows/SignMessage'
import type SignMessageOnChainFlow from './components/flows/SignMessageOnChain'
import type SuccessScreenFlow from './components/flows/SuccessScreen'
import type TokenTransferFlow from './components/flows/TokenTransfer'
import type UpdateSafeFlow from './components/flows/UpdateSafe'
import type UpsertRecoveryFlow from './components/flows/UpsertRecovery'
import type { TxFlow } from './components/TxFlow'
import type { TxModalProvider } from './TxModalProvider'

/**
 * All flow components exported by the tx-flow feature.
 */
export interface TxFlowComponents {
  AddOwnerFlow: typeof AddOwnerFlow
  CancelRecoveryFlow: typeof CancelRecoveryFlow
  ChangeThresholdFlow: typeof ChangeThresholdFlow
  ConfirmBatchFlow: typeof ConfirmBatchFlow
  ConfirmTxFlow: typeof ConfirmTxFlow
  CreateNestedSafeFlow: typeof CreateNestedSafeFlow
  ExecuteBatchFlow: typeof ExecuteBatchFlow
  ManageSignersFlow: typeof ManageSignersFlow
  MigrateSafeL2Flow: typeof MigrateSafeL2Flow
  NestedTxSuccessScreenFlow: typeof NestedTxSuccessScreenFlow
  NewSpendingLimitFlow: typeof NewSpendingLimitFlow
  NewTxFlow: typeof NewTxFlow
  NftTransferFlow: typeof NftTransferFlow
  RecoveryAttemptFlow: typeof RecoveryAttemptFlow
  RecoverAccountFlow: typeof RecoverAccountFlow
  RejectTxFlow: typeof RejectTxFlow
  RemoveGuardFlow: typeof RemoveGuardFlow
  RemoveModuleFlow: typeof RemoveModuleFlow
  RemoveOwnerFlow: typeof RemoveOwnerFlow
  RemoveRecoveryFlow: typeof RemoveRecoveryFlow
  RemoveSpendingLimitFlow: typeof RemoveSpendingLimitFlow
  ReplaceOwnerFlow: typeof ReplaceOwnerFlow
  ReplaceTxFlow: typeof ReplaceTxFlow
  SafeAppsTxFlow: typeof SafeAppsTxFlow
  SignMessageFlow: typeof SignMessageFlow
  SignMessageOnChainFlow: typeof SignMessageOnChainFlow
  SuccessScreenFlow: typeof SuccessScreenFlow
  TokenTransferFlow: typeof TokenTransferFlow
  UpdateSafeFlow: typeof UpdateSafeFlow
  UpsertRecoveryFlow: typeof UpsertRecoveryFlow
  TxFlow: typeof TxFlow
  TxModalProvider: typeof TxModalProvider
}

/**
 * Hooks exported by the tx-flow feature.
 */
export interface TxFlowHooks {
  useTxFlow: () => TxModalContextType
  useTxFlowContext: () => TxFlowContextType
}

/**
 * Full implementation interface for the tx-flow feature.
 */
export interface TxFlowImplementation {
  components: TxFlowComponents
  hooks: TxFlowHooks
}

/**
 * Contract type for the tx-flow feature handle.
 */
export type TxFlowContract = TxFlowImplementation
