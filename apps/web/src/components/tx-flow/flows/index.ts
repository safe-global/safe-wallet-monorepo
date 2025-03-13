import EnableSafenet from '@/features/safenet/components/EnableSafenet'
import SafenetTokenTransfers from '@/features/safenet/components/SafenetTokenTransfers'
import dynamic from 'next/dynamic'

export const AddOwnerFlow = dynamic(() => import('./AddOwner'))
export const CancelRecoveryFlow = dynamic(() => import('./CancelRecovery'))
export const ChangeThresholdFlow = dynamic(() => import('./ChangeThreshold'))
export const ConfirmBatchFlow = dynamic(() => import('./ConfirmBatch'))
export const ConfirmTxFlow = dynamic(() => import('./ConfirmTx'))
export { EnableSafenet as EnableSafenetFlow }
export const ExecuteBatchFlow = dynamic(() => import('./ExecuteBatch'))
export const NewSpendingLimitFlow = dynamic(() => import('./NewSpendingLimit'))
export const NewTxFlow = dynamic(() => import('./NewTx'))
export const NftTransferFlow = dynamic(() => import('./NftTransfer'))
export const RecoverAccountFlow = dynamic(() => import('./RecoverAccount'))
export const RejectTxFlow = dynamic(() => import('./RejectTx'))
export const RemoveGuardFlow = dynamic(() => import('./RemoveGuard'))
export const RemoveModuleFlow = dynamic(() => import('./RemoveModule'))
export const RemoveOwnerFlow = dynamic(() => import('./RemoveOwner'))
export const RemoveRecoveryFlow = dynamic(() => import('./RemoveRecovery'))
export const RemoveSpendingLimitFlow = dynamic(() => import('./RemoveSpendingLimit'))
export const ReplaceOwnerFlow = dynamic(() => import('./ReplaceOwner'))
export const ReplaceTxFlow = dynamic(() => import('./ReplaceTx'))
export const SafeAppsTxFlow = dynamic(() => import('./SafeAppsTx'))
export const SignMessageFlow = dynamic(() => import('./SignMessage'))
export const SignMessageOnChainFlow = dynamic(() => import('./SignMessageOnChain'))
export const SuccessScreenFlow = dynamic(() => import('./SuccessScreen'))
export const NestedTxSuccessScreenFlow = dynamic(() => import('./NestedTxSuccessScreen'))
export const TokenTransferFlow = dynamic(() => import('./TokenTransfer'))
export { SafenetTokenTransfers as SafenetTokenTransfersFlow }
export const UpdateSafeFlow = dynamic(() => import('./UpdateSafe'))
export const UpsertRecoveryFlow = dynamic(() => import('./UpsertRecovery'))
export const RecoveryAttemptFlow = dynamic(() => import('./RecoveryAttempt'))
