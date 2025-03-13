import React from 'react'
import { ListRenderItem } from 'react-native'
import { useSelector } from 'react-redux'
import { Text } from 'tamagui'

import { SafeTab } from '@/src/components/SafeTab'
import { AssetsCard } from '@/src/components/transactions-list/Card/AssetsCard'
import { POLLING_INTERVAL } from '@/src/config/constants'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { Balance, useBalancesGetBalancesV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import { formatValue } from '@/src/utils/formatters'

import { Fallback } from '../Fallback'
import { skipToken } from '@reduxjs/toolkit/query'

export function TokensContainer() {
  const activeSafe = useSelector(selectActiveSafe)

  const { data, isFetching, error } = useBalancesGetBalancesV1Query(
    !activeSafe
      ? skipToken
      : {
          chainId: activeSafe.chainId,
          fiatCode: 'USD',
          safeAddress: activeSafe.address,
          excludeSpam: false,
          trusted: true,
        },
    {
      pollingInterval: POLLING_INTERVAL,
    },
  )

  const renderItem: ListRenderItem<Balance> = React.useCallback(({ item }) => {
    return (
      <AssetsCard
        name={item.tokenInfo.name}
        logoUri={item.tokenInfo.logoUri}
        description={`${formatValue(item.balance, item.tokenInfo.decimals as number)} ${item.tokenInfo.symbol}`}
        rightNode={
          <Text fontSize="$4" fontWeight={400} color="$color">
            ${item.fiatBalance}
          </Text>
        }
      />
    )
  }, [])

  if (isFetching || !data?.items.length || error) {
    return <Fallback loading={isFetching} hasError={!!error} />
  }

  return (
    <SafeTab.FlatList<Balance>
      data={data?.items}
      renderItem={renderItem}
      keyExtractor={(item, index): string => item.tokenInfo.name + index}
    />
  )
}
