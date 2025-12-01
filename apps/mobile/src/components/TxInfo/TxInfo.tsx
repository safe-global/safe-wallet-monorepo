import React, { useCallback } from 'react'
import { type Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useTransactionType } from '@/src/hooks/useTransactionType'
import { TxTokenCard } from '@/src/components/transactions-list/Card/TxTokenCard'
import { TxSettingsCard } from '@/src/components/transactions-list/Card/TxSettingsCard'
import {
  isCancellationTxInfo,
  isCreationTxInfo,
  isCustomTxInfo,
  isMultiSendTxInfo,
  isOrderTxInfo,
  isSettingsChangeTxInfo,
  isStakingTxDepositInfo,
  isStakingTxExitInfo,
  isStakingTxWithdrawInfo,
  isTransferTxInfo,
  isVaultDepositTxInfo,
  isVaultRedeemTxInfo,
  isBridgeOrderTxInfo,
  isLifiSwapTxInfo,
} from '@/src/utils/transaction-guards'
import { TxBatchCard } from '@/src/components/transactions-list/Card/TxBatchCard'
import { TxSafeAppCard } from '@/src/components/transactions-list/Card/TxSafeAppCard'
import { TxRejectionCard } from '@/src/components/transactions-list/Card/TxRejectionCard'
import { TxContractInteractionCard } from '@/src/components/transactions-list/Card/TxContractInteractionCard'
import { TxOrderCard } from '@/src/components/transactions-list/Card/TxOrderCard'
import { TxCreationCard } from '@/src/components/transactions-list/Card/TxCreationCard'
import { TxCardPress } from './types'
import { StakingTxWithdrawCard } from '@/src/components/transactions-list/Card/StakingTxWithdrawCard'
import { StakingTxDepositCard } from '../transactions-list/Card/StakingTxDepositCard'
import { StakingTxExitCard } from '../transactions-list/Card/StakingTxExitCard'
import { VaultTxDepositCard } from '@/src/components/transactions-list/Card/VaultTxDepositCard'
import { VaultTxRedeemCard } from '@/src/components/transactions-list/Card/VaultTxRedeemCard'
import { SafeListItemProps } from '@/src/components/SafeListItem/SafeListItem'
import { TxBridgeCard } from '@/src/components/transactions-list/Card/TxBridgeCard'
import { TxLifiSwapCard } from '@/src/components/transactions-list/Card/TxLifiSwapCard'

type TxInfoProps = {
  tx: Transaction
  onPress?: (tx: TxCardPress) => void
} & Partial<Omit<SafeListItemProps, 'onPress'>>

function TxInfoComponent({ tx, onPress, ...rest }: TxInfoProps) {
  const txType = useTransactionType(tx)
  const txInfo = tx.txInfo

  const onCardPress = useCallback(() => {
    if (onPress) {
      onPress({
        tx,
        type: txType,
      })
    }
  }, [onPress, tx, txType])

  if (isTransferTxInfo(txInfo)) {
    return (
      <TxTokenCard
        txId={tx.id}
        onPress={onCardPress}
        executionInfo={tx.executionInfo}
        txInfo={txInfo}
        txStatus={tx.txStatus}
        {...rest}
      />
    )
  }

  if (isSettingsChangeTxInfo(txInfo)) {
    return (
      <TxSettingsCard txId={tx.id} onPress={onCardPress} executionInfo={tx.executionInfo} txInfo={txInfo} {...rest} />
    )
  }

  if (isMultiSendTxInfo(txInfo) && !tx.safeAppInfo) {
    return <TxBatchCard txId={tx.id} onPress={onCardPress} executionInfo={tx.executionInfo} txInfo={txInfo} {...rest} />
  }

  if (isMultiSendTxInfo(txInfo) && tx.safeAppInfo) {
    return (
      <TxSafeAppCard
        txId={tx.id}
        onPress={onCardPress}
        executionInfo={tx.executionInfo}
        txInfo={txInfo}
        safeAppInfo={tx.safeAppInfo}
        {...rest}
      />
    )
  }

  if (isCreationTxInfo(txInfo)) {
    return (
      <TxCreationCard txId={tx.id} onPress={onCardPress} executionInfo={tx.executionInfo} txInfo={txInfo} {...rest} />
    )
  }

  if (isCancellationTxInfo(txInfo)) {
    return (
      <TxRejectionCard txId={tx.id} onPress={onCardPress} executionInfo={tx.executionInfo} txInfo={txInfo} {...rest} />
    )
  }

  if (isMultiSendTxInfo(txInfo) || isCustomTxInfo(txInfo)) {
    return (
      <TxContractInteractionCard
        txId={tx.id}
        onPress={onCardPress}
        executionInfo={tx.executionInfo}
        txInfo={txInfo}
        safeAppInfo={tx.safeAppInfo}
        {...rest}
      />
    )
  }

  if (isOrderTxInfo(txInfo)) {
    return <TxOrderCard txId={tx.id} onPress={onCardPress} executionInfo={tx.executionInfo} txInfo={txInfo} {...rest} />
  }

  if (isStakingTxDepositInfo(txInfo)) {
    return <StakingTxDepositCard txId={tx.id} info={txInfo} onPress={onCardPress} {...rest} />
  }

  if (isStakingTxExitInfo(txInfo)) {
    return <StakingTxExitCard txId={tx.id} info={txInfo} onPress={onCardPress} {...rest} />
  }

  if (isStakingTxWithdrawInfo(txInfo)) {
    return <StakingTxWithdrawCard txId={tx.id} info={txInfo} onPress={onCardPress} {...rest} />
  }

  if (isVaultDepositTxInfo(txInfo)) {
    return (
      <VaultTxDepositCard txId={tx.id} info={txInfo} onPress={onCardPress} executionInfo={tx.executionInfo} {...rest} />
    )
  }

  if (isVaultRedeemTxInfo(txInfo)) {
    return (
      <VaultTxRedeemCard txId={tx.id} info={txInfo} onPress={onCardPress} executionInfo={tx.executionInfo} {...rest} />
    )
  }

  if (isBridgeOrderTxInfo(txInfo)) {
    return (
      <TxBridgeCard txId={tx.id} txInfo={txInfo} onPress={onCardPress} executionInfo={tx.executionInfo} {...rest} />
    )
  }

  if (isLifiSwapTxInfo(txInfo)) {
    return (
      <TxLifiSwapCard txId={tx.id} txInfo={txInfo} onPress={onCardPress} executionInfo={tx.executionInfo} {...rest} />
    )
  }

  return <></>
}

export const TxInfo = React.memo(TxInfoComponent)
