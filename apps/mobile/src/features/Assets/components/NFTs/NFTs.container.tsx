import React from 'react'

import { SafeTab } from '@/src/components/SafeTab'
import { POLLING_INTERVAL } from '@/src/config/constants'
import { Collectible, CollectiblePage } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import { useGetCollectiblesInfiniteQuery } from '@safe-global/store/gateway'

import { Fallback } from '../Fallback'
import { NFTItem } from './NFTItem'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { NoFunds } from '@/src/features/Assets/components/NoFunds'
import { AssetError } from '../../Assets.error'
import { Loader } from '@/src/components/Loader'
import { getTokenValue } from 'tamagui'

export function NFTsContainer() {
  const activeSafe = useDefinedActiveSafe()

  // Using the infinite query hook
  const { currentData, fetchNextPage, hasNextPage, isFetching, isLoading, isUninitialized, error, refetch } =
    useGetCollectiblesInfiniteQuery(
      {
        chainId: activeSafe.chainId,
        safeAddress: activeSafe.address,
      },
      {
        pollingInterval: POLLING_INTERVAL,
      },
    )

  // Flatten all pages into a single collectibles array
  const allCollectibles = React.useMemo(() => {
    if (!currentData?.pages) {
      return []
    }

    // Combine results from all pages
    return currentData.pages.flatMap((page: CollectiblePage) => page.results || [])
  }, [currentData?.pages])

  const onEndReached = () => {
    if (hasNextPage && !isFetching) {
      fetchNextPage()
    }
  }

  if (error) {
    return (
      <Fallback loading={isFetching}>
        <AssetError assetType={'nft'} onRetry={() => refetch()} />
      </Fallback>
    )
  }

  if (!allCollectibles.length) {
    return (
      <Fallback loading={isFetching || isLoading || isUninitialized}>
        <NoFunds fundsType={'nft'} />
      </Fallback>
    )
  }

  return (
    <SafeTab.FlatList<Collectible>
      onEndReached={onEndReached}
      data={allCollectibles}
      renderItem={NFTItem}
      ListFooterComponent={isFetching ? <Loader size={24} /> : undefined}
      keyExtractor={(item, index) => `${item.address}-${index}`}
      style={{ marginTop: getTokenValue('$2') }}
    />
  )
}
