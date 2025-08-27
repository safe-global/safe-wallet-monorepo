import React from 'react'
import {
  TransactionData,
  TransactionDetails,
  TransferTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { HistoryTokenTransfer } from '../history-views/HistoryTokenTransfer'
import { ETxType } from '@/src/types/txType'
import { getTransactionType } from '@/src/utils/transactions'

import { HistoryGenericView } from '@/src/features/HistoryTransactionDetails/components/history-views/HistoryGenericView'

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
