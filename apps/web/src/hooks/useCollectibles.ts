import { useCallback, useEffect, useMemo } from 'react'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { SerializedError } from '@reduxjs/toolkit'
import type { Collectible } from '@safe-global/store/gateway/AUTO_GENERATED/collectibles'
import {
  useGetCollectiblesInfiniteQuery,
  type CollectiblesInfiniteQueryArg,
} from '@safe-global/store/gateway/collectibles'
import { Errors, logError } from '@/services/exceptions'
import useSafeInfo from './useSafeInfo'

type UseCollectiblesResult = {
  nfts: Collectible[]
  error?: Error
  isInitialLoading: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  loadMore: () => void
}

const getErrorMessage = (error?: FetchBaseQueryError | SerializedError) => {
  if (!error) {
    return undefined
  }

  if ('status' in error) {
    if ('error' in error && error.error) {
      return error.error
    }

    if (typeof error.data === 'string') {
      return error.data
    }

    try {
      return error.data ? JSON.stringify(error.data) : 'Unknown error'
    } catch {
      return 'Unknown error'
    }
  }

  return error.message
}

const useCollectibles = (): UseCollectiblesResult => {
  const { safe, safeAddress } = useSafeInfo()
  const isSafeAddressReady = Boolean(safeAddress)
  const shouldSkip = !isSafeAddressReady || !safe.deployed

  const queryArgs: CollectiblesInfiniteQueryArg = {
    chainId: safe.chainId,
    safeAddress,
  }

  const {
    currentData,
    error: queryError,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useGetCollectiblesInfiniteQuery(queryArgs, {
    skip: shouldSkip,
  })

  const errorMessage = getErrorMessage(queryError)
  const error = useMemo(() => (errorMessage ? new Error(errorMessage) : undefined), [errorMessage])

  useEffect(() => {
    if (errorMessage) {
      logError(Errors._604, errorMessage)
    }
  }, [errorMessage])

  const nfts = useMemo<Collectible[]>(() => {
    if (shouldSkip) {
      return []
    }

    const pages = currentData?.pages ?? []

    return pages.flatMap((page) => page?.results ?? [])
  }, [currentData, shouldSkip])

  const loadMore = useCallback(() => {
    if (!shouldSkip && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, shouldSkip])

  return {
    nfts,
    error,
    isInitialLoading: !isSafeAddressReady || isLoading,
    isFetchingNextPage,
    hasNextPage: Boolean(hasNextPage),
    loadMore,
  }
}

export default useCollectibles
