import React, { useEffect, useState } from 'react'
import { safelyDecodeURIComponent } from 'expo-router/build/fork/getStateFromPath-forks'

import { useGetTxsHistoryQuery } from '@safe-global/store/gateway'
import type { TransactionItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TxHistoryList } from '@/src/features/TxHistory/components/TxHistoryList'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'

export function TxHistoryContainer() {
  const [pageUrl, setPageUrl] = useState<string>()
  const [list, setList] = useState<TransactionItemPage['results']>([])
  const activeSafe = useDefinedActiveSafe()
  const { data, refetch, isFetching, isUninitialized } = useGetTxsHistoryQuery({
    chainId: activeSafe.chainId,
    safeAddress: activeSafe.address,
    cursor: pageUrl && safelyDecodeURIComponent(pageUrl?.split('cursor=')[1]),
  })

  useEffect(() => {
    if (!data?.results) {
      return
    }

    setList((prev) => [...prev, ...data.results])
  }, [data])

  const onEndReached = () => {
    if (!data?.next) {
      return
    }

    setPageUrl(data.next)
    refetch()
  }

  return <TxHistoryList transactions={list} onEndReached={onEndReached} isLoading={isFetching || isUninitialized} />
}
