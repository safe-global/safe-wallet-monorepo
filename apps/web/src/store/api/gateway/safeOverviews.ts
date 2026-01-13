import { type EndpointBuilder } from '@reduxjs/toolkit/query/react'
import type { EntityState } from '@reduxjs/toolkit'

import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { Chain as ChainInfo } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { selectCurrency } from '../../settingsSlice'
import { type SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { makeSafeTag } from '.'
import { additionalSafesRtkApi, additionalSafesRtkApiV2 } from '@safe-global/store/gateway/safes'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { apiSliceWithChainsConfig } from '@safe-global/store/gateway/chains'

// Types for v1 endpoint dispatch
type SafesV1InitiateThunk = ReturnType<typeof additionalSafesRtkApi.endpoints.safesGetOverviewForMany.initiate>
type SafesV1QueryActionResult = ReturnType<SafesV1InitiateThunk>
type SafesV1Dispatch = (action: SafesV1InitiateThunk) => SafesV1QueryActionResult

// Types for v2 endpoint dispatch
type SafesV2InitiateThunk = ReturnType<typeof additionalSafesRtkApiV2.endpoints.safesGetOverviewForManyV2.initiate>
type SafesV2QueryActionResult = ReturnType<SafesV2InitiateThunk>
type SafesV2Dispatch = (action: SafesV2InitiateThunk) => SafesV2QueryActionResult

type SafeOverviewQueueItem = {
  safeAddress: string
  walletAddress?: string
  chainId: string
  currency: string
  useV2: boolean
  dispatchV1: SafesV1Dispatch
  dispatchV2: SafesV2Dispatch
  callback: (result: { data: SafeOverview | undefined; error?: never } | { data?: never; error: string }) => void
}

const _FETCH_TIMEOUT = 300

class SafeOverviewFetcher {
  private requestQueue: SafeOverviewQueueItem[] = []

  private fetchTimeout: NodeJS.Timeout | null = null

  private async fetchSafeOverviews({
    safeIds,
    walletAddress,
    currency,
    dispatchV1,
    dispatchV2,
    useV2,
  }: {
    safeIds: `${number}:0x${string}`[]
    walletAddress?: string
    currency: string
    dispatchV1: SafesV1Dispatch
    dispatchV2: SafesV2Dispatch
    useV2: boolean
  }) {
    if (useV2) {
      const queryThunk = additionalSafesRtkApiV2.endpoints.safesGetOverviewForManyV2.initiate({
        safes: safeIds,
        currency,
        walletAddress,
        trusted: false,
        excludeSpam: true,
      })
      const queryAction: SafesV2QueryActionResult = dispatchV2(queryThunk)

      try {
        return await queryAction.unwrap()
      } finally {
        queryAction.unsubscribe()
      }
    } else {
      const queryThunk = additionalSafesRtkApi.endpoints.safesGetOverviewForMany.initiate({
        safes: safeIds,
        currency,
        walletAddress,
        trusted: false,
        excludeSpam: true,
      })
      const queryAction: SafesV1QueryActionResult = dispatchV1(queryThunk)

      try {
        return await queryAction.unwrap()
      } finally {
        queryAction.unsubscribe()
      }
    }
  }

  private async processQueuedItems() {
    this.fetchTimeout && clearTimeout(this.fetchTimeout)
    this.fetchTimeout = null

    // Take ALL items from the queue - the store handles chunking internally
    const itemsToProcess = this.requestQueue
    this.requestQueue = []

    if (itemsToProcess.length === 0) {
      return
    }

    let overviews: SafeOverview[]
    try {
      // Group by v1/v2 and fetch in parallel
      const v1Items = itemsToProcess.filter((item) => !item.useV2)
      const v2Items = itemsToProcess.filter((item) => item.useV2)

      const { walletAddress, currency, dispatchV1, dispatchV2 } = itemsToProcess[0]

      const [v1Overviews, v2Overviews] = await Promise.all([
        v1Items.length > 0
          ? this.fetchSafeOverviews({
              safeIds: v1Items.map((item) => makeSafeTag(item.chainId, item.safeAddress)),
              currency,
              walletAddress,
              dispatchV1,
              dispatchV2,
              useV2: false,
            })
          : [],
        v2Items.length > 0
          ? this.fetchSafeOverviews({
              safeIds: v2Items.map((item) => makeSafeTag(item.chainId, item.safeAddress)),
              currency,
              walletAddress,
              dispatchV1,
              dispatchV2,
              useV2: true,
            })
          : [],
      ])

      overviews = [...v1Overviews, ...v2Overviews]
    } catch (err) {
      // Overviews could not be fetched
      itemsToProcess.forEach((item) => item.callback({ error: 'Could not fetch Safe overview' }))
      return
    }

    itemsToProcess.forEach((item) => {
      const overview = overviews.find(
        (entry) => sameAddress(entry.address.value, item.safeAddress) && entry.chainId === item.chainId,
      )

      item.callback({ data: overview })
    })
  }

  private enqueueRequest(item: SafeOverviewQueueItem) {
    this.requestQueue.push(item)

    // Use timer-based batching only - the store handles chunking internally
    if (this.fetchTimeout === null) {
      this.fetchTimeout = setTimeout(() => {
        this.processQueuedItems()
      }, _FETCH_TIMEOUT)
    }
  }

  async getOverview(item: Omit<SafeOverviewQueueItem, 'callback'>) {
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

const batchedFetcher = new SafeOverviewFetcher()

type MultiOverviewQueryParams = {
  currency: string
  walletAddress?: string
  safes: SafeItem[]
}

/**
 * Check if a chain has the PORTFOLIO_ENDPOINT feature enabled (v2 API).
 */
function shouldUseV2(chainsData: EntityState<ChainInfo, string> | undefined, chainId: string): boolean {
  const chain = chainsData?.entities[chainId]
  return chain ? hasFeature(chain, FEATURES.PORTFOLIO_ENDPOINT) : false
}

export const safeOverviewEndpoints = (builder: EndpointBuilder<any, 'Submissions', 'gatewayApi'>) => ({
  getSafeOverview: builder.query<SafeOverview | null, { safeAddress: string; walletAddress?: string; chainId: string }>(
    {
      async queryFn({ safeAddress, walletAddress, chainId }, { getState, dispatch }) {
        const currency = selectCurrency(getState() as never)
        const dispatchV1: SafesV1Dispatch = (action) => dispatch(action)
        const dispatchV2: SafesV2Dispatch = (action) => dispatch(action)

        if (!safeAddress) {
          return { data: null }
        }

        try {
          const chainsSelector = apiSliceWithChainsConfig.endpoints.getChainsConfig.select(undefined)
          const chainsQueryResult = chainsSelector(getState() as never)
          const useV2 = shouldUseV2(chainsQueryResult.data, chainId)
          const safeOverview = await batchedFetcher.getOverview({
            chainId,
            currency,
            walletAddress,
            safeAddress,
            useV2,
            dispatchV1,
            dispatchV2,
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
      const dispatchV1: SafesV1Dispatch = (action) => dispatch(action)
      const dispatchV2: SafesV2Dispatch = (action) => dispatch(action)

      if (safes.length === 0) {
        return { data: [] }
      }

      try {
        const chainsSelector = apiSliceWithChainsConfig.endpoints.getChainsConfig.select(undefined)
        const chainsQueryResult = chainsSelector(getState() as never)
        const chainsData = chainsQueryResult.data

        const promisedSafeOverviews = safes.map((safe) =>
          batchedFetcher.getOverview({
            chainId: safe.chainId,
            safeAddress: safe.address,
            currency,
            walletAddress,
            useV2: shouldUseV2(chainsData, safe.chainId),
            dispatchV1,
            dispatchV2,
          }),
        )
        const safeOverviews = await Promise.all(promisedSafeOverviews)
        return { data: safeOverviews.filter(Boolean) as SafeOverview[] }
      } catch (error) {
        return { error: { status: 'CUSTOM_ERROR', error: (error as Error).message } }
      }
    },
  }),
})
