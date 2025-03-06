import React from 'react'
import {
  CustomTransactionInfo,
  MultisigExecutionDetails,
  SettingsChangeTransaction,
  TransactionData,
  TransactionDetails,
  TransferTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { QueueSummary } from '../confirmation-views/QueueSummary'
import { AddSigner } from '../confirmation-views/AddSigner'
import { ETxType } from '@/src/types/txType'
import { getTransactionType } from '@/src/utils/transactions'
import { Contract } from '../confirmation-views/Contract'
import { SendNFT } from '../confirmation-views/SendNFT'
import { SwapOrder } from '../confirmation-views/SwapOrder'
import { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { RemoveSigner } from '../confirmation-views/RemoveSigner'
import { GenericView } from '../confirmation-views/GenericView'
interface ConfirmationViewProps {
  txDetails: TransactionDetails
}

export function ConfirmationView({ txDetails }: ConfirmationViewProps) {
  const confirmationViewType = getTransactionType({ txInfo: txDetails.txInfo })

  switch (confirmationViewType) {
    case ETxType.TOKEN_TRANSFER:
      return (
        <QueueSummary
          executedAt={txDetails.executedAt || 0}
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
          txInfo={txDetails.txInfo as TransferTransactionInfo}
        />
      )
    case ETxType.NFT_TRANSFER:
      return (
        <SendNFT
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
          txInfo={txDetails.txInfo as TransferTransactionInfo}
        />
      )
    case ETxType.ADD_SIGNER:
      return (
        <AddSigner
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
          txInfo={txDetails.txInfo as SettingsChangeTransaction}
        />
      )
    case ETxType.REMOVE_SIGNER:
      return (
        <RemoveSigner
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
          txInfo={txDetails.txInfo as SettingsChangeTransaction}
        />
      )
    case ETxType.SWAP_ORDER:
      return (
        <SwapOrder
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
          txInfo={txDetails.txInfo as OrderTransactionInfo}
        />
      )
    case ETxType.CONTRACT_INTERACTION:
      return (
        <Contract
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
          txInfo={txDetails.txInfo as CustomTransactionInfo}
        />
      )
    default:
      return (
        <GenericView
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
          txInfo={txDetails.txInfo as SettingsChangeTransaction}
          txData={txDetails.txData as TransactionData}
        />
      )
  }
}
