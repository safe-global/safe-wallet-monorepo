import React, { useCallback } from 'react'
import { ListRenderItem } from 'react-native'
import { getTokenValue } from 'tamagui'

import { SafeTab } from '@/src/components/SafeTab'
import { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { Fallback } from '../Fallback'
import { NoFunds } from '@/src/features/Assets/components/NoFunds'
import { AssetError } from '@/src/features/Assets/Assets.error'
import { TokenItem } from './TokenItem'
import { useTokenBalances } from './useTokenBalances'

export function TokensContainer() {
  const { visibleItems, currency, isFetching, error, isLoading, hasItems, allFilteredByDust, refetch } =
    useTokenBalances()

  const renderItem: ListRenderItem<Balance> = useCallback(
    ({ item }) => <TokenItem item={item} currency={currency} />,
    [currency],
  )

  if (error) {
    return (
      <Fallback loading={isFetching}>
        <AssetError assetType={'token'} onRetry={() => refetch()} />
      </Fallback>
    )
  }

  if (isLoading || !hasItems) {
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
