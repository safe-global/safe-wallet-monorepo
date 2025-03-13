import { safelyDecodeURIComponent } from 'expo-router/build/fork/getStateFromPath-forks'
import React, { useState } from 'react'

import { SafeTab } from '@/src/components/SafeTab'
import { POLLING_INTERVAL } from '@/src/config/constants'
import {
  Collectible,
  CollectiblePage,
  useCollectiblesGetCollectiblesV2Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'

import { Fallback } from '../Fallback'
import { NFTItem } from './NFTItem'
import { useInfiniteScroll } from '@/src/hooks/useInfiniteScroll'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { Spinner } from 'tamagui'

export function NFTsContainer() {
  const activeSafe = useDefinedActiveSafe()
  const [pageUrl, setPageUrl] = useState<string>()

  const { data, isFetching, error, refetch } = useCollectiblesGetCollectiblesV2Query(
    {
      chainId: activeSafe.chainId,
      safeAddress: activeSafe.address,
      cursor: pageUrl && safelyDecodeURIComponent(pageUrl?.split('cursor=')[1]),
    },
    {
      pollingInterval: POLLING_INTERVAL,
    },
  )
  const { list, onEndReached } = useInfiniteScroll<CollectiblePage, Collectible>({
    refetch,
    setPageUrl,
    data,
  })

  if (!list?.results.length || error) {
    return <Fallback loading={isFetching || !list} hasError={!!error} />
  }

  return (
    <SafeTab.FlatList<Collectible>
      onEndReached={onEndReached}
      data={list?.results}
      renderItem={NFTItem}
      ListFooterComponent={isFetching ? <Spinner size="small" /> : undefined}
      keyExtractor={(item) => item.id}
    />
  )
}
