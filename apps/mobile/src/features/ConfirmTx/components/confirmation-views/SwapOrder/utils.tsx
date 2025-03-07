import React from 'react'
import { Logo } from '@/src/components/Logo'
import { View, Text } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Badge } from '@/src/components/Badge'
import { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { formatWithSchema } from '@/src/utils/date'
import { ellipsis, formatValue, getLimitPrice } from '@/src/utils/formatters'
import { TokenInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { formatAmount } from '@safe-global/utils/formatNumber'
import { CopyButton } from '@/src/components/CopyButton'

export const formatSwapOrderItems = (txInfo: OrderTransactionInfo, chain: Chain) => {
  const expiresAt = formatWithSchema(txInfo.validUntil * 1000, 'dd/MM/yyyy, HH:mm')
  const executedFee = formatValue(txInfo.executedFee ?? '0', (txInfo.executedFeeToken as TokenInfo).decimals)
  const limitPrice = getLimitPrice(txInfo)

  return [
    {
      label: 'Execution price',
      value: `${formatAmount(limitPrice)} ${txInfo.sellToken.symbol} = 1 ${txInfo.buyToken.symbol}`,
    },
    {
      label: 'Expiry',
      value: expiresAt,
    },
    {
      label: 'Order ID',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$2">
          {'uid' in txInfo && (
            <>
              <Text fontSize="$4">{ellipsis(txInfo.uid, 6)}</Text>
              <CopyButton value={txInfo.uid} color={'$textSecondaryLight'} />
              <SafeFontIcon name="external-link" size={14} color="textSecondaryLight" />
            </>
          )}
        </View>
      ),
    },
    {
      label: 'Network',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$2">
          <Logo logoUri={chain.chainLogoUri} size="$6" />
          <Text fontSize="$4">{chain.chainName}</Text>
        </View>
      ),
    },
    {
      label: 'Status',
      render: () => (
        <View flexDirection="row" alignItems="center" gap="$2">
          <Badge
            circular={false}
            themeName="badge_warning_variant1"
            textContentProps={{ fontWeight: 500 }}
            content={
              <View flexDirection="row" alignItems="center" gap="$2">
                <SafeFontIcon name="sign" size={14} color="$color" />
                <Text color="$color">{txInfo.status}</Text>
              </View>
            }
          />
        </View>
      ),
    },
    {
      label: 'Total fees',
      value: `${executedFee} ${(txInfo.executedFeeToken as TokenInfo).symbol}`,
    },
  ]
}
