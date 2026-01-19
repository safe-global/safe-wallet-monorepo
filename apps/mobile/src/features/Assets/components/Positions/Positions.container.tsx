import React, { useState, useCallback } from 'react'
import { RefreshControl } from 'react-native'
import { getTokenValue } from 'tamagui'

import { SafeTab } from '@/src/components/SafeTab'
import { useAppSelector } from '@/src/store/hooks'
import { selectCurrency } from '@/src/store/settingsSlice'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { calculatePositionsFiatTotal } from '@safe-global/utils/features/positions'

import { Fallback } from '../Fallback'
import { PositionsEmpty } from './PositionsEmpty'
import { PositionsError } from './PositionsError'
import { ProtocolSection } from './ProtocolSection'
import { usePositions } from '../../hooks/usePositions'

export const PositionsContainer = () => {
  const currency = useAppSelector(selectCurrency)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data, isFetching, error, isLoading, refetch } = usePositions()

  const totalFiatValue = React.useMemo(() => calculatePositionsFiatTotal(data), [data])

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }, [refetch])

  const renderItem = React.useCallback(
    ({ item }: { item: Protocol }) => (
      <ProtocolSection protocol={item} totalFiatValue={totalFiatValue} currency={currency} />
    ),
    [totalFiatValue, currency],
  )

  if (error && !data?.length) {
    return (
      <Fallback loading={isFetching}>
        <PositionsError onRetry={refetch} />
      </Fallback>
    )
  }

  if (isLoading || !data?.length) {
    return (
      <Fallback loading={isFetching || isLoading}>
        <PositionsEmpty />
      </Fallback>
    )
  }

  return (
    <SafeTab.FlatList<Protocol>
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.protocol}
      style={{ marginTop: getTokenValue('$2'), paddingHorizontal: getTokenValue('$2') }}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
    />
  )
}
