import React from 'react'
import {
  TransactionData,
  TransactionDetails,
  TransferTransactionInfo,
  TwapOrderTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { HistoryTokenTransfer } from '../history-views/HistoryTokenTransfer'
import { HistorySwapOrder } from '../history-views/HistorySwapOrder'
import { HistoryAddSigner } from '../history-views/HistoryAddSigner'
import { HistoryRemoveSigner } from '../history-views/HistoryRemoveSigner'
import { HistoryChangeThreshold } from '../history-views/HistoryChangeThreshold'
import { ETxType } from '@/src/types/txType'
import { getTransactionType } from '@/src/utils/transactions'
import { HistoryGenericView } from '@/src/features/HistoryTransactionDetails/components/history-views/HistoryGenericView'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { NormalizedSettingsChangeTransaction } from '@/src/features/ConfirmTx/components/ConfirmationView/types'

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
          executedAt={txDetails.executedAt as number} // in the history there is no way this is undefined
          txInfo={txDetails.txInfo as TransferTransactionInfo}
        />
      )

    case ETxType.SWAP_ORDER:
      return (
        <HistorySwapOrder
          txId={txDetails.txId}
          executedAt={txDetails.executedAt as number} // in the history there is no way this is undefined
          txInfo={txDetails.txInfo as OrderTransactionInfo | TwapOrderTransactionInfo}
        />
      )
    case ETxType.ADD_SIGNER:
      return (
        <HistoryAddSigner
          txId={txDetails.txId}
          executedAt={txDetails.executedAt as number} // in the history there is no way this is undefined
          txInfo={txDetails.txInfo as NormalizedSettingsChangeTransaction}
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
        />
      )
    case ETxType.REMOVE_SIGNER:
      return (
        <HistoryRemoveSigner
          txId={txDetails.txId}
          executedAt={txDetails.executedAt as number} // in the history there is no way this is undefined
          txInfo={txDetails.txInfo as NormalizedSettingsChangeTransaction}
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
        />
      )
    case ETxType.CHANGE_THRESHOLD:
      return (
        <HistoryChangeThreshold
          txId={txDetails.txId}
          executedAt={txDetails.executedAt as number} // in the history there is no way this is undefined
          txInfo={txDetails.txInfo as NormalizedSettingsChangeTransaction}
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
        />
      )

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
