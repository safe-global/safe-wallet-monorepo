import React, { useCallback } from 'react'
import { TransactionInfoType } from '@safe-global/store/gateway/types'
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
interface TxInfoProps {
  tx: Transaction
  bordered?: boolean
  inQueue?: boolean
  onPress?: (tx: TxCardPress) => void
}

function TxInfoComponent({ tx, bordered, inQueue, onPress }: TxInfoProps) {
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
        executionInfo={tx.executionInfo}
        inQueue={inQueue}
        bordered={bordered}
        txInfo={txInfo}
        txStatus={tx.txStatus}
        onPress={onCardPress}
      />
    )
  }

  if (isSettingsChangeTxInfo(txInfo)) {
    return (
      <TxSettingsCard
        onPress={onCardPress}
        executionInfo={tx.executionInfo}
        inQueue={inQueue}
        bordered={bordered}
        txInfo={txInfo}
      />
    )
  }

  if (isMultiSendTxInfo(txInfo) && tx.txInfo.type === TransactionInfoType.CUSTOM) {
    return (
      <TxBatchCard
        executionInfo={tx.executionInfo}
        inQueue={inQueue}
        onPress={onCardPress}
        bordered={bordered}
        txInfo={txInfo}
        safeAppInfo={tx.safeAppInfo}
      />
    )
  }

  if (isMultiSendTxInfo(txInfo) && tx.safeAppInfo) {
    return (
      <TxSafeAppCard
        executionInfo={tx.executionInfo}
        inQueue={inQueue}
        onPress={onCardPress}
        bordered={bordered}
        txInfo={txInfo}
        safeAppInfo={tx.safeAppInfo}
      />
    )
  }

  if (isCreationTxInfo(txInfo)) {
    return (
      <TxCreationCard
        onPress={onCardPress}
        executionInfo={tx.executionInfo}
        inQueue={inQueue}
        bordered={bordered}
        txInfo={txInfo}
      />
    )
  }

  if (isCancellationTxInfo(txInfo)) {
    return (
      <TxRejectionCard
        onPress={onCardPress}
        executionInfo={tx.executionInfo}
        inQueue={inQueue}
        bordered={bordered}
        txInfo={txInfo}
      />
    )
  }

  if (isMultiSendTxInfo(txInfo) || isCustomTxInfo(txInfo)) {
    return (
      <TxContractInteractionCard
        executionInfo={tx.executionInfo}
        onPress={onCardPress}
        inQueue={inQueue}
        bordered={bordered}
        txInfo={txInfo}
        safeAppInfo={tx.safeAppInfo}
      />
    )
  }

  if (isOrderTxInfo(txInfo)) {
    return (
      <TxOrderCard
        bordered={bordered}
        onPress={onCardPress}
        executionInfo={tx.executionInfo}
        inQueue={inQueue}
        txInfo={txInfo}
      />
    )
  }

  if (isStakingTxDepositInfo(txInfo)) {
    return <StakingTxDepositCard info={txInfo} />
  }

  if (isStakingTxExitInfo(txInfo)) {
    return <StakingTxExitCard info={txInfo} />
  }

  if (isStakingTxWithdrawInfo(txInfo)) {
    return <StakingTxWithdrawCard info={txInfo} />
  }

  if (isVaultDepositTxInfo(txInfo)) {
    return <VaultTxDepositCard info={txInfo} />
  }

  if (isVaultRedeemTxInfo(txInfo)) {
    return <VaultTxRedeemCard info={txInfo} />
  }

  return <></>
}

export const TxInfo = React.memo(TxInfoComponent, (prevProps, nextProps) => {
  return prevProps.tx.txHash === nextProps.tx.txHash
})
