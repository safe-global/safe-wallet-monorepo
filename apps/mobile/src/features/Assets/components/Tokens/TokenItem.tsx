import React from 'react'
import { Text, View } from 'tamagui'

import { AssetsCard } from '@/src/components/transactions-list/Card/AssetsCard'
import { FiatChange } from '@/src/components/FiatChange'
import { formatCurrency, formatCurrencyPrecise } from '@safe-global/utils/utils/formatNumber'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { shouldDisplayPreciseBalance } from '@/src/utils/balance'
import { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

interface TokenItemProps {
  item: Balance
  currency: string
}

export function TokenItem({ item, currency }: TokenItemProps) {
  const { tokenInfo, balance, fiatBalance } = item
  const formattedAmount = `${formatVisualAmount(balance, tokenInfo.decimals as number)} ${tokenInfo.symbol}`
  const formattedFiat = shouldDisplayPreciseBalance(fiatBalance, 7)
    ? formatCurrencyPrecise(fiatBalance, currency)
    : formatCurrency(fiatBalance, currency)

  return (
    <AssetsCard
      testID={`token-${tokenInfo.symbol}`}
      name={tokenInfo.name}
      logoUri={tokenInfo.logoUri}
      description={formattedAmount}
      rightNode={
        <View alignItems="flex-end">
          <Text fontSize="$4" fontWeight={600} color="$color" testID={`token-${tokenInfo.symbol}-fiat-balance`}>
            {formattedFiat}
          </Text>
          <View marginTop="$1">
            <FiatChange balanceItem={item} />
          </View>
        </View>
      }
    />
  )
}
