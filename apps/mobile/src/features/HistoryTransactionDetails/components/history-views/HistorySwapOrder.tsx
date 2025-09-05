import React, { useMemo } from 'react'
import { YStack } from 'tamagui'
import { SwapHeader } from '@/src/components/SwapHeader'
import { ListTable } from '@/src/features/ConfirmTx/components/ListTable'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import { formatValue } from '@/src/utils/formatters'
import { isTwapOrderTxInfo } from '@/src/utils/transaction-guards'
import { TwapOrderTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { formatSwapOrderItemsForHistory, formatTwapOrderItemsForHistory } from '@/src/utils/swapOrderUtils'
import { HistoryAdvancedDetailsButton } from '@/src/features/HistoryTransactionDetails/components/HistoryAdvancedDetailsButton'

interface HistorySwapOrderProps {
  txId: string
  txInfo: OrderTransactionInfo | TwapOrderTransactionInfo
}

export function HistorySwapOrder({ txId, txInfo }: HistorySwapOrderProps) {
  const order = txInfo
  const isTwapOrder = isTwapOrderTxInfo(order)

  const activeSafe = useDefinedActiveSafe()
  const chain = useAppSelector((state) => selectChainById(state, activeSafe.chainId))

  const orderItems = useMemo(() => {
    if (!chain) {
      return []
    }

    if (isTwapOrder) {
      return formatTwapOrderItemsForHistory(order as TwapOrderTransactionInfo, chain)
    }

    return formatSwapOrderItemsForHistory(txInfo as OrderTransactionInfo, chain)
  }, [txInfo, order, isTwapOrder, chain])

  // Format the swap header data for history context
  const { sellToken, buyToken, sellAmount, buyAmount, kind } = order

  const sellTokenValue = formatValue(sellAmount, sellToken.decimals)
  const buyTokenValue = formatValue(buyAmount, buyToken.decimals)

  const isSellOrder = kind === 'sell'

  return (
    <YStack gap="$4">
      <SwapHeader
        fromToken={sellToken}
        toToken={buyToken}
        fromAmount={sellTokenValue}
        toAmount={buyTokenValue}
        fromLabel={isSellOrder ? 'Sell' : 'For at most'}
        toLabel={isSellOrder ? 'For at least' : 'Buy exactly'}
      />

      <ListTable items={orderItems}>
        <HistoryAdvancedDetailsButton txId={txId} />
      </ListTable>
    </YStack>
  )
}
