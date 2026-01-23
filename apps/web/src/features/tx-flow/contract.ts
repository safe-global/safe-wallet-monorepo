/**
 * Contract types for the tx-flow feature.
 * Defines the interface that the feature implementation must satisfy.
 */
import type { ComponentType } from 'react'
import type { TxModalContextType, TxFlowContextType } from './types'

/**
 * All flow components exported by the tx-flow feature.
 * Uses ComponentType<any> because each flow has different props.
 */
export interface TxFlowComponents {
  [key: string]: ComponentType<any>
  AddOwnerFlow: ComponentType<any>
  CancelRecoveryFlow: ComponentType<any>
  ChangeThresholdFlow: ComponentType<any>
  ConfirmBatchFlow: ComponentType<any>
  ConfirmTxFlow: ComponentType<any>
  CreateNestedSafeFlow: ComponentType<any>
  ExecuteBatchFlow: ComponentType<any>
  ManageSignersFlow: ComponentType<any>
  MigrateSafeL2Flow: ComponentType<any>
  NestedTxSuccessScreenFlow: ComponentType<any>
  NewSpendingLimitFlow: ComponentType<any>
  NewTxFlow: ComponentType<any>
  NftTransferFlow: ComponentType<any>
  RecoveryAttemptFlow: ComponentType<any>
  RecoverAccountFlow: ComponentType<any>
  RejectTxFlow: ComponentType<any>
  RemoveGuardFlow: ComponentType<any>
  RemoveModuleFlow: ComponentType<any>
  RemoveOwnerFlow: ComponentType<any>
  RemoveRecoveryFlow: ComponentType<any>
  RemoveSpendingLimitFlow: ComponentType<any>
  ReplaceOwnerFlow: ComponentType<any>
  ReplaceTxFlow: ComponentType<any>
  SafeAppsTxFlow: ComponentType<any>
  SignMessageFlow: ComponentType<any>
  SignMessageOnChainFlow: ComponentType<any>
  SuccessScreenFlow: ComponentType<any>
  TokenTransferFlow: ComponentType<any>
  UpdateSafeFlow: ComponentType<any>
  UpsertRecoveryFlow: ComponentType<any>
  TxFlow: ComponentType<any>
  TxModalProvider: ComponentType<{ children: React.ReactNode }>
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
