import React from 'react'
import { Theme, Text, View } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { TxInfo } from '@/src/components/TxInfo'
import { getOrderClass } from '@/src/hooks/useTransactionType'
import { isSwapTransferOrderTxInfo } from '@/src/utils/transaction-guards'
import { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { TransactionQueuedItem, TransactionItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Container } from '@/src/components/Container'
import { TxCardPress } from '@/src/components/TxInfo/types'

interface TxGroupedCard {
  transactions: (TransactionItem | TransactionQueuedItem)[]
  inQueue?: boolean
  onPress?: (tx: TxCardPress) => void
}

const orderClassTitles: Record<string, string> = {
  limit: 'Limit order settlement',
  twap: 'TWAP order settlement',
  liquidity: 'Liquidity order settlement',
  market: 'Swap order settlement',
}

const getSettlementOrderTitle = (order: OrderTransactionInfo): string => {
  const orderClass = getOrderClass(order)
  return orderClassTitles[orderClass] || orderClassTitles['market']
}

function TxGroupedCardComponent({ transactions, inQueue, onPress }: TxGroupedCard) {
  const firstTxInfo = transactions[0].transaction.txInfo
  const isSwapTransfer = isSwapTransferOrderTxInfo(firstTxInfo)
  const label = isSwapTransfer ? getSettlementOrderTitle(firstTxInfo) : 'Bulk transactions'

  return (
    <Container>
      <View flexDirection="row" alignItems="center" gap="$2">
        <Theme name="logo">
          <View
            backgroundColor="$background"
            padding="$2"
            borderRadius={100}
            height={32}
            width={32}
            justifyContent="center"
            alignItems="center"
          >
            <SafeFontIcon name="batch" size={16} />
          </View>
        </Theme>
        <Text fontSize="$4" fontWeight={600}>
          {label}
        </Text>
      </View>
      <View>
        {transactions.map((item, index) => (
          <View testID="tx-group-info" key={`${item.transaction.id}-${index}`} marginTop={12}>
            <TxInfo inQueue={inQueue} bordered tx={item.transaction} onPress={onPress} />
          </View>
        ))}
      </View>
    </Container>
  )
}

export const TxGroupedCard = React.memo(TxGroupedCardComponent)
