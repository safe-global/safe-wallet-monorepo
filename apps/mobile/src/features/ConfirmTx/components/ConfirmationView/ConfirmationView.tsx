import React from 'react'
import {
  CustomTransactionInfo,
  MultisigExecutionDetails,
  SettingsChangeTransaction,
  TransactionData,
  TransactionDetails,
  TransferTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TokenTransfer } from '../confirmation-views/TokenTransfer'
import { AddSigner } from '../confirmation-views/AddSigner'
import { ETxType } from '@/src/types/txType'
import { getTransactionType } from '@/src/utils/transactions'
import { Contract } from '../confirmation-views/Contract'
import { SendNFT } from '../confirmation-views/SendNFT'
import { SwapOrder } from '../confirmation-views/SwapOrder'
import { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { RemoveSigner } from '../confirmation-views/RemoveSigner'
import { GenericView } from '../confirmation-views/GenericView'
import { NormalizedSettingsChangeTransaction } from './types'
interface ConfirmationViewProps {
  txDetails: TransactionDetails
}

export function ConfirmationView({ txDetails }: ConfirmationViewProps) {
  const confirmationViewType = getTransactionType({ txInfo: txDetails.txInfo })

  switch (confirmationViewType) {
    case ETxType.TOKEN_TRANSFER:
      return (
        <TokenTransfer
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
          txId={txDetails.txId}
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
          txInfo={txDetails.txInfo as NormalizedSettingsChangeTransaction}
        />
      )
    case ETxType.REMOVE_SIGNER:
      return (
        <RemoveSigner
          txId={txDetails.txId}
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
          txInfo={txDetails.txInfo as NormalizedSettingsChangeTransaction}
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
          txId={txDetails.txId}
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
          txInfo={txDetails.txInfo as CustomTransactionInfo}
        />
      )
    default:
      return (
        <GenericView
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
          txId={txDetails.txId}
          txInfo={txDetails.txInfo as SettingsChangeTransaction}
          txData={txDetails.txData as TransactionData}
        />
      )
  }
}
