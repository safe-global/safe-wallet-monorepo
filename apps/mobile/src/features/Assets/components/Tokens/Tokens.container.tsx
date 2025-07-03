import React from 'react'
import { ListRenderItem } from 'react-native'
import { useSelector } from 'react-redux'
import { getTokenValue, Text } from 'tamagui'

import { SafeTab } from '@/src/components/SafeTab'
import { AssetsCard } from '@/src/components/transactions-list/Card/AssetsCard'
import { POLLING_INTERVAL } from '@/src/config/constants'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { Balance, useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { Fallback } from '../Fallback'
import { skipToken } from '@reduxjs/toolkit/query'
import { formatCurrency, formatCurrencyPrecise } from '@safe-global/utils/utils/formatNumber'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { shouldDisplayPreciseBalance } from '@/src/utils/balance'
import { NoFunds } from '@/src/features/Assets/components/NoFunds'
import { AssetError } from '@/src/features/Assets/Assets.error'
import { useAppSelector } from '@/src/store/hooks'
import { selectCurrency } from '@/src/store/settingsSlice'
export function TokensContainer() {
  const activeSafe = useSelector(selectActiveSafe)
  const currency = useAppSelector(selectCurrency)
  const { data, isFetching, error, isLoading, refetch } = useBalancesGetBalancesV1Query(
    !activeSafe
      ? skipToken
      : {
          chainId: activeSafe.chainId,
          fiatCode: currency,
          safeAddress: activeSafe.address,
          excludeSpam: false,
          trusted: true,
        },
    {
      pollingInterval: POLLING_INTERVAL,
    },
  )

  const renderItem: ListRenderItem<Balance> = React.useCallback(
    ({ item }) => {
      const fiatBalance = item.fiatBalance
      return (
        <AssetsCard
          name={item.tokenInfo.name}
          logoUri={item.tokenInfo.logoUri}
          description={`${formatVisualAmount(item.balance, item.tokenInfo.decimals as number)} ${item.tokenInfo.symbol}`}
          rightNode={
            <Text fontSize="$4" fontWeight={600} color="$color">
              {shouldDisplayPreciseBalance(fiatBalance, 7)
                ? formatCurrencyPrecise(fiatBalance, currency)
                : formatCurrency(fiatBalance, currency)}
            </Text>
          }
        />
      )
    },
    [currency],
  )

  if (error) {
    return (
      <Fallback loading={isFetching}>
        <AssetError assetType={'token'} onRetry={() => refetch()} />
      </Fallback>
    )
  }

  if (isLoading || !data?.items.length) {
    return (
      <Fallback loading={isFetching}>
        <NoFunds fundsType={'token'} />
      </Fallback>
    )
  }

  return (
    <SafeTab.FlatList<Balance>
      data={data?.items}
      renderItem={renderItem}
      keyExtractor={(item, index): string => item.tokenInfo.name + index}
      style={{ marginTop: getTokenValue('$2') }}
    />
  )
}
