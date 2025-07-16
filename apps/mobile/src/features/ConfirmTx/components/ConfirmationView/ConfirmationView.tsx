import React from 'react'
import {
  CustomTransactionInfo,
  MultisigExecutionDetails,
  SettingsChangeTransaction,
  TransactionData,
  TransactionDetails,
  TransferTransactionInfo,
  VaultDepositTransactionInfo,
  VaultRedeemTransactionInfo,
  NativeStakingDepositTransactionInfo,
  NativeStakingValidatorsExitTransactionInfo,
  NativeStakingWithdrawTransactionInfo,
  BridgeAndSwapTransactionInfo,
  SwapTransactionInfo,
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
import { VaultDeposit } from '@/src/features/ConfirmTx/components/confirmation-views/VaultDeposit'
import { VaultRedeem } from '../confirmation-views/VaultRedeem'
import { CancelTx } from '@/src/features/ConfirmTx/components/confirmation-views/CancelTx'
import { StakingDeposit, StakingWithdrawRequest, StakingExit } from '../confirmation-views/Stake'
import { BridgeTransaction } from '../confirmation-views/BridgeTransaction'
import { LifiSwapTransaction } from '../confirmation-views/LifiSwapTransaction'

interface ConfirmationViewProps {
  txDetails: TransactionDetails
}

export function ConfirmationView({ txDetails }: ConfirmationViewProps) {
  const confirmationViewType = getTransactionType({ txInfo: txDetails.txInfo })

  switch (confirmationViewType) {
    case ETxType.TOKEN_TRANSFER:
      return (
        <TokenTransfer
          txId={txDetails.txId}
          executedAt={txDetails.executedAt || 0}
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
          txInfo={txDetails.txInfo as TransferTransactionInfo}
        />
      )
    case ETxType.NFT_TRANSFER:
      return (
        <SendNFT
          txId={txDetails.txId}
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
          txId={txDetails.txId}
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
          txInfo={txDetails.txInfo as OrderTransactionInfo}
          decodedData={txDetails.txData?.dataDecoded}
        />
      )
    case ETxType.CANCEL_TX:
      return (
        <CancelTx
          txId={txDetails.txId}
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
          txInfo={txDetails.txInfo as CustomTransactionInfo}
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
    case ETxType.STAKE_DEPOSIT:
      return (
        <StakingDeposit
          txId={txDetails.txId}
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
          txInfo={txDetails.txInfo as NativeStakingDepositTransactionInfo}
        />
      )
    case ETxType.VAULT_DEPOSIT:
      return (
        <VaultDeposit
          txId={txDetails.txId}
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
          txInfo={txDetails.txInfo as VaultDepositTransactionInfo}
          decodedData={txDetails.txData?.dataDecoded}
        />
      )
    case ETxType.VAULT_REDEEM:
      return (
        <VaultRedeem
          txId={txDetails.txId}
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
          txInfo={txDetails.txInfo as VaultRedeemTransactionInfo}
        />
      )
    case ETxType.STAKE_WITHDRAW_REQUEST:
      return (
        <StakingWithdrawRequest
          txId={txDetails.txId}
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
          txInfo={txDetails.txInfo as NativeStakingValidatorsExitTransactionInfo}
        />
      )
    case ETxType.STAKE_EXIT:
      return (
        <StakingExit
          txId={txDetails.txId}
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
          txInfo={txDetails.txInfo as NativeStakingWithdrawTransactionInfo}
        />
      )
    case ETxType.BRIDGE_ORDER:
      return <BridgeTransaction txId={txDetails.txId} txInfo={txDetails.txInfo as BridgeAndSwapTransactionInfo} />
    case ETxType.LIFI_SWAP:
      return (
        <LifiSwapTransaction
          txId={txDetails.txId}
          executionInfo={txDetails.detailedExecutionInfo as MultisigExecutionDetails}
          txInfo={txDetails.txInfo as SwapTransactionInfo}
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
