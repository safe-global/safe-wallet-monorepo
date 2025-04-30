import React from 'react'
import { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { isSwapOrderTxInfo, isSwapTransferOrderTxInfo, isTwapOrderTxInfo } from '@/src/utils/transaction-guards'
import { SellOrder } from '@/src/components/transactions-list/Card/TxOrderCard/SellOrder'
import { TwapOrder } from '@/src/components/transactions-list/Card/TxOrderCard/TwapOrder'

interface TxSwapCardProps {
  txInfo: OrderTransactionInfo
  bordered?: boolean
  inQueue?: boolean
  executionInfo?: Transaction['executionInfo']
  onPress: () => void
}

export function TxOrderCard({ txInfo, bordered, executionInfo, inQueue, onPress }: TxSwapCardProps) {
  if (!txInfo) {
    return null
  }

  if (isTwapOrderTxInfo(txInfo)) {
    return (
      <TwapOrder order={txInfo} bordered={bordered} executionInfo={executionInfo} inQueue={inQueue} onPress={onPress} />
    )
  }

  if (isSwapOrderTxInfo(txInfo) || isSwapTransferOrderTxInfo(txInfo)) {
    return (
      <SellOrder order={txInfo} bordered={bordered} executionInfo={executionInfo} inQueue={inQueue} onPress={onPress} />
    )
  }
  return null
}
