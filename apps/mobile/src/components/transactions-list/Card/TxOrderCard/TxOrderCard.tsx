import React from 'react'
import { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { isSwapOrderTxInfo, isSwapTransferOrderTxInfo, isTwapOrderTxInfo } from '@/src/utils/transaction-guards'
import { SellOrder } from '@/src/components/transactions-list/Card/TxOrderCard/SellOrder'
import { TwapOrder } from '@/src/components/transactions-list/Card/TxOrderCard/TwapOrder'
import { getOrderClass } from '@/src/hooks/useTransactionType'
import { SafeListItemProps } from '@/src/components/SafeListItem/SafeListItem'

type TxSwapCardProps = {
  txInfo: OrderTransactionInfo
} & Partial<SafeListItemProps>

export function TxOrderCard({ txInfo, ...rest }: TxSwapCardProps) {
  if (!txInfo) {
    return null
  }

  if (isTwapOrderTxInfo(txInfo)) {
    return <TwapOrder order={txInfo} {...rest} />
  }

  if (isSwapOrderTxInfo(txInfo) || isSwapTransferOrderTxInfo(txInfo)) {
    const orderClass = getOrderClass(txInfo)
    const type = orderClass === 'limit' ? 'Limit order' : 'Swap order'

    return <SellOrder order={txInfo} type={type} {...rest} />
  }
  return null
}
