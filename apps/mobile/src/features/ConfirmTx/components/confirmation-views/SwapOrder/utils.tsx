import React from 'react'
import { Logo } from '@/src/components/Logo'
import { View, Text } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { OrderTransactionInfo as Order, StartTimeValue } from '@safe-global/store/gateway/types'
import { formatWithSchema, getPeriod } from '@safe-global/utils/utils/date'
import { ellipsis, formatValue, getLimitPrice } from '@/src/utils/formatters'
import { TwapOrderTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { formatAmount } from '@safe-global/utils/utils/formatNumber'
import { CopyButton } from '@/src/components/CopyButton'
import { getExecutionPrice } from '@safe-global/utils/features/swap/helpers/utils'
import { getOrderFeeBps } from '@safe-global/utils/features/swap/helpers/utils'
import StatusLabel from '@/src/features/ConfirmTx/components/confirmation-views/SwapOrder/StatusLabel'
import { TouchableOpacity, Linking } from 'react-native'
import { type ListTableItem } from '../../ListTable'

const priceRow = (order: Order) => {
  const { status, sellToken, buyToken } = order
  const executionPrice = getExecutionPrice(order)
  const limitPrice = getLimitPrice(order)

  if (status === 'fulfilled') {
    return {
      label: 'Execution price',
      value: `1 ${buyToken.symbol} = ${formatAmount(executionPrice)} ${sellToken.symbol}`,
    }
  }

  return {
    label: 'Limit price',
    value: `1 ${buyToken.symbol} = ${formatAmount(limitPrice)} ${sellToken.symbol}`,
  }
}

const statusRow = (order: Order) => {
  const { status } = order

  return {
    label: 'Status',
    render: () => <StatusLabel status={status} />,
  }
}

export const surplusFee = (order: Pick<Order, 'fullAppData' | 'executedFee' | 'executedFeeToken'>) => {
  const bps = getOrderFeeBps(order)

  return {
    label: 'Widget fee',
    value: `${Number(bps) / 100} %`,
  }
}

export const formatSwapOrderItems = (txInfo: Order, chain: Chain): ListTableItem[] => {
  const expiresAt = formatWithSchema(txInfo.validUntil * 1000, 'dd/MM/yyyy, HH:mm')

  const openCowExplorer = () => {
    if ('uid' in txInfo) {
      Linking.openURL(txInfo.explorerUrl)
    }
  }
  const items = [
    priceRow(txInfo),
    {
      label: 'Expiry',
      value: expiresAt,
    },
    'uid' in txInfo
      ? {
          label: 'Order ID',
          render: () => (
            <View flexDirection="row" alignItems="center" gap="$2">
              <Text fontSize="$4">{ellipsis(txInfo.uid, 6)}</Text>
              <CopyButton value={txInfo.uid} color={'$textSecondaryLight'} />
              <TouchableOpacity onPress={openCowExplorer}>
                <SafeFontIcon name="external-link" size={14} color="$textSecondaryLight" />
              </TouchableOpacity>
            </View>
          ),
        }
      : null,
    {
      label: 'Network',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$2">
          <Logo logoUri={chain.chainLogoUri} size="$6" />
          <Text fontSize="$4">{chain.chainName}</Text>
        </View>
      ),
    },
    statusRow(txInfo),
    surplusFee(txInfo),
  ]
  return items.filter((item) => item !== null) as ListTableItem[]
}

export const formatTwapOrderItems = (order: TwapOrderTransactionInfo) => {
  const { timeBetweenParts } = order
  let startTime = ''
  if (order.startTime.startType === StartTimeValue.AT_MINING_TIME) {
    startTime = 'Now'
  }
  if (order.startTime.startType === StartTimeValue.AT_EPOCH) {
    startTime = `At block number: ${order.startTime.epoch}`
  }

  return [
    {
      renderRow: () => (
        <View flexDirection="row" alignItems="center" gap="$2">
          <Text fontSize="$4">Order will be split in</Text>
          <Text fontSize="$4" fontWeight={'700'}>
            {order.numberOfParts} equal parts
          </Text>
        </View>
      ),
    },
    {
      label: 'Sell amount',
      value: `${formatValue(order.partSellAmount, order.sellToken.decimals)} ${order.sellToken.symbol} per part`,
    },
    {
      label: 'Buy amount',
      value: `${formatValue(order.minPartLimit, order.buyToken.decimals)} ${order.buyToken.symbol} per part`,
    },
    {
      label: 'Start time',
      value: startTime,
    },
    {
      label: 'Part duration',
      value: getPeriod(+timeBetweenParts),
    },
    {
      label: 'Total duration',
      value: getPeriod(+order.timeBetweenParts * +order.numberOfParts),
    },
  ]
}
