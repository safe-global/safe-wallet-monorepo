import React from 'react'
import {
  TransactionData,
  TransactionDetails,
  TransferTransactionInfo,
  TwapOrderTransactionInfo,
  VaultDepositTransactionInfo,
  VaultRedeemTransactionInfo,
  NativeStakingDepositTransactionInfo,
  NativeStakingValidatorsExitTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { HistoryTokenTransfer } from '../history-views/HistoryTokenTransfer'
import { HistorySwapOrder } from '../history-views/HistorySwapOrder'
import { HistoryAddSigner } from '../history-views/HistoryAddSigner'
import { HistoryRemoveSigner } from '../history-views/HistoryRemoveSigner'
import { HistoryChangeThreshold } from '../history-views/HistoryChangeThreshold'
import { HistoryVaultDeposit } from '../history-views/HistoryVaultDeposit'
import { HistoryVaultRedeem } from '../history-views/HistoryVaultRedeem'
import { HistoryStakeDeposit } from '../history-views/HistoryStakeDeposit'
import { HistoryStakeWithdrawRequest } from '../history-views/HistoryStakeWithdrawRequest'
import { ETxType } from '@/src/types/txType'
import { getTransactionType } from '@/src/utils/transactions'
import { HistoryGenericView } from '@/src/features/HistoryTransactionDetails/components/history-views/HistoryGenericView'
import { HistoryContract } from '@/src/features/HistoryTransactionDetails/components/history-views/HistoryContract'
import { NormalizedSettingsChangeTransaction } from '@/src/features/ConfirmTx/components/ConfirmationView/types'
import { CancelTx } from '@/src/features/HistoryTransactionDetails/components/history-views/CancelTx'
import { CustomTransactionInfo, MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

interface HistoryTransactionViewProps {
  txDetails: TransactionDetails
}

export function HistoryTransactionView({ txDetails }: HistoryTransactionViewProps) {
  const transactionType = getTransactionType({ txInfo: txDetails.txInfo })

  switch (transactionType) {
    case ETxType.TOKEN_TRANSFER:
    case ETxType.NFT_TRANSFER:
      return (
        <HistoryTokenTransfer
          txId={txDetails.txId}
          txInfo={txDetails.txInfo as TransferTransactionInfo}
          txData={txDetails.txData as TransactionData}
        />
      )

    case ETxType.SWAP_ORDER:
      return (
        <HistorySwapOrder
          txId={txDetails.txId}
          txInfo={txDetails.txInfo as OrderTransactionInfo | TwapOrderTransactionInfo}
        />
      )
    case ETxType.ADD_SIGNER:
      return (
        <HistoryAddSigner
          txId={txDetails.txId}
          txInfo={txDetails.txInfo as NormalizedSettingsChangeTransaction}
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
        />
      )
    case ETxType.REMOVE_SIGNER:
      return (
        <HistoryRemoveSigner
          txId={txDetails.txId}
          txInfo={txDetails.txInfo as NormalizedSettingsChangeTransaction}
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
        />
      )
    case ETxType.CHANGE_THRESHOLD:
      return (
        <HistoryChangeThreshold
          txId={txDetails.txId}
          txInfo={txDetails.txInfo as NormalizedSettingsChangeTransaction}
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
        />
      )
    case ETxType.CANCEL_TX:
      return (
        <CancelTx
          txId={txDetails.txId}
          txInfo={txDetails.txInfo as CustomTransactionInfo}
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
        />
      )

    case ETxType.CONTRACT_INTERACTION:
      return (
        <HistoryContract
          txId={txDetails.txId}
          txInfo={txDetails.txInfo as CustomTransactionInfo}
          _executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
        />
      )

    case ETxType.STAKE_DEPOSIT:
      return (
        <HistoryStakeDeposit
          txId={txDetails.txId}
          txInfo={txDetails.txInfo as NativeStakingDepositTransactionInfo}
          txData={txDetails.txData as TransactionData}
        />
      )

    case ETxType.STAKE_WITHDRAW_REQUEST:
      return (
        <HistoryStakeWithdrawRequest
          txId={txDetails.txId}
          txInfo={txDetails.txInfo as NativeStakingValidatorsExitTransactionInfo}
          txData={txDetails.txData as TransactionData}
        />
      )

    case ETxType.VAULT_DEPOSIT:
      return <HistoryVaultDeposit txId={txDetails.txId} txInfo={txDetails.txInfo as VaultDepositTransactionInfo} />

    case ETxType.VAULT_REDEEM:
      return <HistoryVaultRedeem txId={txDetails.txId} txInfo={txDetails.txInfo as VaultRedeemTransactionInfo} />

    // For all other transaction types, use a generic view that can adapt
    default:
      return (
        <HistoryGenericView
          txId={txDetails.txId}
          txInfo={txDetails.txInfo}
          txData={txDetails.txData as TransactionData}
          executedAt={txDetails.executedAt as number}
        />
      )
  }
}
