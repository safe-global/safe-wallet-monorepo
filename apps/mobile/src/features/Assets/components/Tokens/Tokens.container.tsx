import React, { useMemo } from 'react'
import { ListRenderItem } from 'react-native'
import { useSelector } from 'react-redux'
import { getTokenValue, Text, View } from 'tamagui'

import { SafeTab } from '@/src/components/SafeTab'
import { AssetsCard } from '@/src/components/transactions-list/Card/AssetsCard'
import { FiatChange } from '@/src/components/FiatChange'
import { DUST_THRESHOLD, POLLING_INTERVAL } from '@/src/config/constants'
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
import { selectCurrency, selectHideDust, selectTokenList, TOKEN_LISTS } from '@/src/store/settingsSlice'
import { useHasFeature } from '@/src/hooks/useHasFeature'
import { FEATURES } from '@safe-global/utils/utils/chains'

export function TokensContainer() {
  const activeSafe = useSelector(selectActiveSafe)
  const currency = useAppSelector(selectCurrency)
  const tokenList = useAppSelector(selectTokenList)
  const hideDust = useAppSelector(selectHideDust)
  const hasDefaultTokenlist = useHasFeature(FEATURES.DEFAULT_TOKENLIST)

  const trusted = hasDefaultTokenlist ? tokenList === TOKEN_LISTS.TRUSTED : false

  const { data, isFetching, error, isLoading, refetch } = useBalancesGetBalancesV1Query(
    !activeSafe
      ? skipToken
      : {
          chainId: activeSafe.chainId,
          fiatCode: currency,
          safeAddress: activeSafe.address,
          trusted,
        },
    {
      pollingInterval: POLLING_INTERVAL,
    },
  )

  const visibleItems = useMemo(() => {
    if (!data?.items) {
      return undefined
    }
    if (!hideDust) {
      return data.items
    }
    return data.items.filter((item) => Number(item.fiatBalance) >= DUST_THRESHOLD)
  }, [data?.items, hideDust])

  const allFilteredByDust = hideDust && data?.items && data.items.length > 0 && visibleItems?.length === 0

  const renderItem: ListRenderItem<Balance> = React.useCallback(
    ({ item }) => {
      const fiatBalance = item.fiatBalance
      return (
        <AssetsCard
          testID={`token-${item.tokenInfo.symbol}`}
          name={item.tokenInfo.name}
          logoUri={item.tokenInfo.logoUri}
          description={`${formatVisualAmount(item.balance, item.tokenInfo.decimals as number)} ${
            item.tokenInfo.symbol
          }`}
          rightNode={
            <View alignItems="flex-end">
              <Text
                fontSize="$4"
                fontWeight={600}
                color="$color"
                testID={`token-${item.tokenInfo.symbol}-fiat-balance`}
              >
                {shouldDisplayPreciseBalance(fiatBalance, 7)
                  ? formatCurrencyPrecise(fiatBalance, currency)
                  : formatCurrency(fiatBalance, currency)}
              </Text>
              <View marginTop="$1">
                <FiatChange balanceItem={item} />
              </View>
            </View>
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

  if (allFilteredByDust) {
    return (
      <Fallback loading={isFetching}>
        <NoFunds
          fundsType={'token'}
          title={'No tokens to show'}
          description={'All tokens have a value below $0.01. Disable "Hide small balances" to see them.'}
        />
      </Fallback>
    )
  }

  return (
    <SafeTab.FlatList<Balance>
      data={visibleItems}
      renderItem={renderItem}
      keyExtractor={(item, index): string => item.tokenInfo.name + index}
      style={{ marginTop: getTokenValue('$2') }}
    />
  )
}
