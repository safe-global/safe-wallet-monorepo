import { type EndpointBuilder } from '@reduxjs/toolkit/query/react'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'

import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { RootState } from '../..'
import { selectCurrency } from '../../settingsSlice'
import { type SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { makeSafeTag } from '.'
import { additionalSafesRtkApi, additionalSafesRtkApiV2 } from '@safe-global/store/gateway/safes'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { apiSliceWithChainsConfig } from '@safe-global/store/gateway/chains'

type SafeOverviewDispatch = ThunkDispatch<RootState, unknown, UnknownAction>

const _BATCH_SIZE = 10
const _FETCH_TIMEOUT = 300

// Simple batching utility for v1 endpoint
class SafeOverviewFetcherV1 {
  private requestQueue: Array<{
    safeAddress: string
    walletAddress?: string
    chainId: string
    currency: string
    dispatch: SafeOverviewDispatch
    callback: (result: { data: SafeOverview | undefined; error?: never } | { data?: never; error: string }) => void
  }> = []

  private fetchTimeout: NodeJS.Timeout | null = null

  private async processQueuedItems() {
    const nextBatch = this.requestQueue.slice(0, _BATCH_SIZE)
    this.requestQueue = this.requestQueue.slice(_BATCH_SIZE)

    if (nextBatch.length === 0) return

    try {
      this.fetchTimeout && clearTimeout(this.fetchTimeout)
      this.fetchTimeout = null

      const safeIds = nextBatch.map((request) => makeSafeTag(request.chainId, request.safeAddress))
      const { walletAddress, currency, dispatch } = nextBatch[0]

      const queryThunk = additionalSafesRtkApi.endpoints.safesGetOverviewForMany.initiate({
        safes: safeIds,
        currency,
        walletAddress,
        trusted: false,
        excludeSpam: true,
      })
      const queryAction = dispatch(queryThunk)

      try {
        const overviews = await queryAction.unwrap()
        nextBatch.forEach((item) => {
          const overview = overviews.find(
            (entry) => sameAddress(entry.address.value, item.safeAddress) && entry.chainId === item.chainId,
          )
          item.callback({ data: overview })
        })
      } finally {
        queryAction.unsubscribe()
      }
    } catch (err) {
      nextBatch.forEach((item) => item.callback({ error: 'Could not fetch Safe overview' }))
    }
  }

  private enqueueRequest(item: {
    safeAddress: string
    walletAddress?: string
    chainId: string
    currency: string
    dispatch: SafeOverviewDispatch
    callback: (result: { data: SafeOverview | undefined; error?: never } | { data?: never; error: string }) => void
  }) {
    this.requestQueue.push(item)

    if (this.requestQueue.length >= _BATCH_SIZE) {
      this.processQueuedItems()
    }

    if (this.fetchTimeout === null) {
      this.fetchTimeout = setTimeout(() => this.processQueuedItems(), _FETCH_TIMEOUT)
    }
  }

  async getOverview(item: {
    safeAddress: string
    walletAddress?: string
    chainId: string
    currency: string
    dispatch: SafeOverviewDispatch
  }): Promise<SafeOverview | undefined> {
    return new Promise<SafeOverview | undefined>((resolve, reject) => {
      this.enqueueRequest({
        ...item,
        callback: (result) => {
          if ('data' in result) {
            resolve(result.data)
          } else {
            reject(result.error)
          }
        },
      })
    })
  }
}

// Simple batching utility for v2 endpoint
class SafeOverviewFetcherV2 {
  private requestQueue: Array<{
    safeAddress: string
    walletAddress?: string
    chainId: string
    currency: string
    dispatch: SafeOverviewDispatch
    callback: (result: { data: SafeOverview | undefined; error?: never } | { data?: never; error: string }) => void
  }> = []

  private fetchTimeout: NodeJS.Timeout | null = null

  private async processQueuedItems() {
    const nextBatch = this.requestQueue.slice(0, _BATCH_SIZE)
    this.requestQueue = this.requestQueue.slice(_BATCH_SIZE)

    if (nextBatch.length === 0) return

    try {
      this.fetchTimeout && clearTimeout(this.fetchTimeout)
      this.fetchTimeout = null

      const safeIds = nextBatch.map((request) => makeSafeTag(request.chainId, request.safeAddress))
      const { walletAddress, currency, dispatch } = nextBatch[0]

      const queryThunk = additionalSafesRtkApiV2.endpoints.safesGetOverviewForManyV2.initiate({
        safes: safeIds,
        currency,
        walletAddress,
        trusted: false,
        excludeSpam: true,
      })
      const queryAction = dispatch(queryThunk)

      try {
        const overviews = await queryAction.unwrap()
        nextBatch.forEach((item) => {
          const overview = overviews.find(
            (entry) => sameAddress(entry.address.value, item.safeAddress) && entry.chainId === item.chainId,
          )
          item.callback({ data: overview })
        })
      } finally {
        queryAction.unsubscribe()
      }
    } catch (err) {
      nextBatch.forEach((item) => item.callback({ error: 'Could not fetch Safe overview' }))
    }
  }

  private enqueueRequest(item: {
    safeAddress: string
    walletAddress?: string
    chainId: string
    currency: string
    dispatch: SafeOverviewDispatch
    callback: (result: { data: SafeOverview | undefined; error?: never } | { data?: never; error: string }) => void
  }) {
    this.requestQueue.push(item)

    if (this.requestQueue.length >= _BATCH_SIZE) {
      this.processQueuedItems()
    }

    if (this.fetchTimeout === null) {
      this.fetchTimeout = setTimeout(() => this.processQueuedItems(), _FETCH_TIMEOUT)
    }
  }

  async getOverview(item: {
    safeAddress: string
    walletAddress?: string
    chainId: string
    currency: string
    dispatch: SafeOverviewDispatch
  }): Promise<SafeOverview | undefined> {
    return new Promise<SafeOverview | undefined>((resolve, reject) => {
      this.enqueueRequest({
        ...item,
        callback: (result) => {
          if ('data' in result) {
            resolve(result.data)
          } else {
            reject(result.error)
          }
        },
      })
    })
  }
}

const batchedFetcherV1 = new SafeOverviewFetcherV1()
const batchedFetcherV2 = new SafeOverviewFetcherV2()

type MultiOverviewQueryParams = {
  currency: string
  walletAddress?: string
  safes: SafeItem[]
}

export const safeOverviewEndpoints = (builder: EndpointBuilder<any, 'Submissions', 'gatewayApi'>) => ({
  getSafeOverview: builder.query<SafeOverview | null, { safeAddress: string; walletAddress?: string; chainId: string }>(
    {
      async queryFn({ safeAddress, walletAddress, chainId }, { getState, dispatch }) {
        const state = getState() as RootState
        const currency = selectCurrency(state)

        if (!safeAddress) {
          return { data: null }
        }

        // Check if the chain has the PORTFOLIO_ENDPOINT feature enabled
        const chainsSelector = apiSliceWithChainsConfig.endpoints.getChainsConfig.select(undefined)
        const chainsQueryResult = chainsSelector(state)
        const chain = chainsQueryResult.data?.entities[chainId]
        const useV2 = chain ? hasFeature(chain, FEATURES.PORTFOLIO_ENDPOINT) : false

        try {
          const fetcher = useV2 ? batchedFetcherV2 : batchedFetcherV1
          const safeOverview = await fetcher.getOverview({
            chainId,
            currency,
            walletAddress,
            safeAddress,
            dispatch: dispatch as SafeOverviewDispatch,
          })
          return { data: safeOverview ?? null }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: asError(error).message } }
        }
      },
    },
  ),
  getMultipleSafeOverviews: builder.query<SafeOverview[], MultiOverviewQueryParams>({
    async queryFn(params, { dispatch, getState }) {
      const { safes, walletAddress, currency } = params
      const state = getState() as RootState

      if (safes.length === 0) {
        return { data: [] }
      }

      // Get chains data to check feature flags
      const chainsSelector = apiSliceWithChainsConfig.endpoints.getChainsConfig.select(undefined)
      const chainsQueryResult = chainsSelector(state)

      try {
        // Route each safe to the appropriate fetcher based on its chain's feature flag
        const promisedSafeOverviews: Promise<SafeOverview | undefined>[] = safes.map((safe) => {
          const chain = chainsQueryResult.data?.entities[safe.chainId]
          const useV2 = chain ? hasFeature(chain, FEATURES.PORTFOLIO_ENDPOINT) : false
          const fetcher = useV2 ? batchedFetcherV2 : batchedFetcherV1

          return fetcher.getOverview({
            chainId: safe.chainId,
            safeAddress: safe.address,
            currency,
            walletAddress,
            dispatch: dispatch as SafeOverviewDispatch,
          })
        })

        const safeOverviews: (SafeOverview | undefined)[] = await Promise.all(promisedSafeOverviews)
        return { data: safeOverviews.filter(Boolean) as SafeOverview[] }
      } catch (error) {
        return { error: { status: 'CUSTOM_ERROR', error: (error as Error).message } }
      }
    },
  }),
})
