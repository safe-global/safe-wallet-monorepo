/**
 * Lazy-loaded implementation for the tx-flow feature.
 *
 * This file is only loaded when the feature is accessed via useLoadFeature().
 * All 33 flow components are bundled together in this chunk (no nested lazy loading)
 * since tx-flow is always enabled and frequently used.
 */
import { TxModalProvider, TxModalContext } from './TxModalProvider'
import { TxFlow } from './components/TxFlow'
import { TxFlowContext } from './contexts/TxFlowProvider'
import { useContext } from 'react'

// Import all flow components directly (no dynamic imports - bundled in feature chunk)
import AddOwnerFlow from './components/flows/AddOwner'
import CancelRecoveryFlow from './components/flows/CancelRecovery'
import ChangeThresholdFlow from './components/flows/ChangeThreshold'
import ConfirmBatchFlow from './components/flows/ConfirmBatch'
import ConfirmTxFlow from './components/flows/ConfirmTx'
import CreateNestedSafeFlow from './components/flows/CreateNestedSafe'
import ExecuteBatchFlow from './components/flows/ExecuteBatch'
import ManageSignersFlow from './components/flows/ManagerSigners'
import MigrateSafeL2Flow from './components/flows/MigrateSafeL2'
import NestedTxSuccessScreenFlow from './components/flows/NestedTxSuccessScreen'
import NewSpendingLimitFlow from './components/flows/NewSpendingLimit'
import NewTxFlow from './components/flows/NewTx'
import NftTransferFlow from './components/flows/NftTransfer'
import RecoveryAttemptFlow from './components/flows/RecoveryAttempt'
import RecoverAccountFlow from './components/flows/RecoverAccount'
import RejectTxFlow from './components/flows/RejectTx'
import RemoveGuardFlow from './components/flows/RemoveGuard'
import RemoveModuleFlow from './components/flows/RemoveModule'
import RemoveOwnerFlow from './components/flows/RemoveOwner'
import RemoveRecoveryFlow from './components/flows/RemoveRecovery'
import RemoveSpendingLimitFlow from './components/flows/RemoveSpendingLimit'
import ReplaceOwnerFlow from './components/flows/ReplaceOwner'
import ReplaceTxFlow from './components/flows/ReplaceTx'
import SafeAppsTxFlow from './components/flows/SafeAppsTx'
import SignMessageFlow from './components/flows/SignMessage'
import SignMessageOnChainFlow from './components/flows/SignMessageOnChain'
import SuccessScreenFlow from './components/flows/SuccessScreen'
import TokenTransferFlow from './components/flows/TokenTransfer'
import UpdateSafeFlow from './components/flows/UpdateSafe'
import UpsertRecoveryFlow from './components/flows/UpsertRecovery'

import type { TxFlowImplementation } from './contract'
import type { TxModalContextType, TxFlowContextType } from './types'

// Hook implementations
function useTxFlow(): TxModalContextType {
  return useContext(TxModalContext)
}

function useTxFlowContext(): TxFlowContextType {
  return useContext(TxFlowContext)
}

/**
 * Feature implementation exported as default.
 * This is what gets loaded when handle.load() is called.
 */
const txFlowFeature: TxFlowImplementation = {
  components: {
    // All 33 flow components
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

    // Core components
    TxFlow,
    TxModalProvider,
  },
  hooks: {
    useTxFlow,
    useTxFlowContext,
  },
}

export default txFlowFeature
