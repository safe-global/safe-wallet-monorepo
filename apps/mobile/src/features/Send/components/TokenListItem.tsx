import React, { memo } from 'react'
import { Pressable } from 'react-native'
import { Text, View } from 'tamagui'
import { AssetsCard } from '@/src/components/transactions-list/Card/AssetsCard'
import { FiatChange } from '@/src/components/FiatChange'
import { formatCurrency, formatCurrencyPrecise } from '@safe-global/utils/utils/formatNumber'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { shouldDisplayPreciseBalance } from '@/src/utils/balance'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

interface TokenListItemProps {
  item: Balance
  currency: string
  onPress: (tokenAddress: string) => void
}

export const TokenListItem = memo(function TokenListItem({ item, currency, onPress }: TokenListItemProps) {
  const { tokenInfo, balance, fiatBalance } = item
  const formattedAmount = `${formatVisualAmount(balance, tokenInfo.decimals as number)} ${tokenInfo.symbol}`
  const formattedFiat = shouldDisplayPreciseBalance(fiatBalance, 7)
    ? formatCurrencyPrecise(fiatBalance, currency)
    : formatCurrency(fiatBalance, currency)

  const tokenAddress =
    tokenInfo.type === 'NATIVE_TOKEN' ? '0x0000000000000000000000000000000000000000' : tokenInfo.address

  return (
    <Pressable onPress={() => onPress(tokenAddress)} testID={`send-token-${tokenInfo.symbol}`}>
      <AssetsCard
        name={tokenInfo.name}
        logoUri={tokenInfo.logoUri}
        description={formattedAmount}
        rightNode={
          <View alignItems="flex-end">
            <Text fontSize="$4" fontWeight={600} color="$color">
              {formattedFiat}
            </Text>
            <View marginTop="$1">
              <FiatChange balanceItem={item} />
            </View>
          </View>
        }
      />
    </Pressable>
  )
})
