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

type MultiOverviewQueryParams = {
  currency: string
  walletAddress?: string
  safes: SafeItem[]
}

type StoreDispatch = ThunkDispatch<RootState, unknown, UnknownAction>

type SafeOverviewQueueItem = {
  safeAddress: string
  walletAddress?: string
  chainId: string
  currency: string
  dispatch: StoreDispatch
  callback: (result: { data: SafeOverview | undefined; error?: never } | { data?: never; error: string }) => void
}

const _BATCH_SIZE = 10
const _FETCH_TIMEOUT = 300

/**
 * Batched fetcher for Safe overviews.
 * Collects individual requests and batches them together to reduce API calls.
 */
class SafeOverviewFetcher {
  private requestQueue: SafeOverviewQueueItem[] = []
  private fetchTimeout: NodeJS.Timeout | null = null
  private useV2: boolean

  constructor(useV2: boolean) {
    this.useV2 = useV2
  }

  private getEndpoint() {
    return this.useV2
      ? additionalSafesRtkApiV2.endpoints.safesGetOverviewForManyV2
      : additionalSafesRtkApi.endpoints.safesGetOverviewForMany
  }

  private async fetchSafeOverviews({
    safeIds,
    walletAddress,
    currency,
    dispatch,
  }: {
    safeIds: string[]
    walletAddress?: string
    currency: string
    dispatch: StoreDispatch
  }) {
    const endpoint = this.getEndpoint()
    const queryAction = dispatch(
      endpoint.initiate({
        safes: safeIds,
        currency,
        walletAddress,
        trusted: false,
        excludeSpam: true,
      }),
    )

    try {
      return await queryAction.unwrap()
    } finally {
      queryAction.unsubscribe()
    }
  }

  private async processQueuedItems() {
    const nextBatch = this.requestQueue.slice(0, _BATCH_SIZE)
    this.requestQueue = this.requestQueue.slice(_BATCH_SIZE)

    this.fetchTimeout && clearTimeout(this.fetchTimeout)
    this.fetchTimeout = null

    if (nextBatch.length === 0) {
      return
    }

    let overviews: SafeOverview[]
    try {
      const safeIds = nextBatch.map((request) => makeSafeTag(request.chainId, request.safeAddress))
      const { walletAddress, currency, dispatch } = nextBatch[0]
      overviews = await this.fetchSafeOverviews({ safeIds, currency, walletAddress, dispatch })
    } catch {
      nextBatch.forEach((item) => item.callback({ error: 'Could not fetch Safe overview' }))
      return
    }

    nextBatch.forEach((item) => {
      const overview = overviews.find(
        (entry) => sameAddress(entry.address.value, item.safeAddress) && entry.chainId === item.chainId,
      )
      item.callback({ data: overview })
    })

    // Process remaining items if any
    if (this.requestQueue.length > 0) {
      this.processQueuedItems()
    }
  }

  private enqueueRequest(item: SafeOverviewQueueItem) {
    this.requestQueue.push(item)

    if (this.requestQueue.length >= _BATCH_SIZE) {
      this.processQueuedItems()
    } else if (this.fetchTimeout === null) {
      this.fetchTimeout = setTimeout(() => {
        this.processQueuedItems()
      }, _FETCH_TIMEOUT)
    }
  }

  async getOverview(item: Omit<SafeOverviewQueueItem, 'callback'>): Promise<SafeOverview | undefined> {
    return new Promise((resolve, reject) => {
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

// Two fetcher instances - one for v1, one for v2
const fetcherV1 = new SafeOverviewFetcher(false)
const fetcherV2 = new SafeOverviewFetcher(true)

/**
 * Check if a chain has the PORTFOLIO_ENDPOINT feature enabled (v2 API).
 */
function shouldUseV2(state: RootState, chainId: string): boolean {
  const chainsSelector = apiSliceWithChainsConfig.endpoints.getChainsConfig.select(undefined)
  const chainsQueryResult = chainsSelector(state)
  const chain = chainsQueryResult.data?.entities[chainId]
  return chain ? hasFeature(chain, FEATURES.PORTFOLIO_ENDPOINT) : false
}

/**
 * Get the appropriate fetcher based on the v2 feature flag.
 */
function getFetcher(useV2: boolean): SafeOverviewFetcher {
  return useV2 ? fetcherV2 : fetcherV1
}

/**
 * Get the appropriate endpoint based on the v2 feature flag.
 */
function getEndpoint(useV2: boolean) {
  return useV2
    ? additionalSafesRtkApiV2.endpoints.safesGetOverviewForManyV2
    : additionalSafesRtkApi.endpoints.safesGetOverviewForMany
}

/**
 * Execute a query directly (without batching) and return the result.
 */
async function executeQuery(
  dispatch: StoreDispatch,
  useV2: boolean,
  params: { safes: string[]; currency: string; walletAddress?: string },
): Promise<SafeOverview[]> {
  const endpoint = getEndpoint(useV2)
  const queryAction = dispatch(
    endpoint.initiate({
      ...params,
      trusted: false,
      excludeSpam: true,
    }),
  )

  try {
    return await queryAction.unwrap()
  } finally {
    queryAction.unsubscribe()
  }
}

/**
 * Web app endpoints that decide between v1 and v2 based on feature flags.
 * - getSafeOverview: Batches individual requests (up to 10, with 300ms timeout)
 * - getMultipleSafeOverviews: Passes all safes directly to store (store handles chunking)
 */
export const safeOverviewEndpoints = (builder: EndpointBuilder<any, 'Submissions', 'gatewayApi'>) => ({
  getSafeOverview: builder.query<SafeOverview | null, { safeAddress: string; walletAddress?: string; chainId: string }>(
    {
      async queryFn({ safeAddress, walletAddress, chainId }, { getState, dispatch }) {
        const state = getState() as RootState
        const currency = selectCurrency(state)

        if (!safeAddress) {
          return { data: null }
        }

        try {
          const useV2 = shouldUseV2(state, chainId)
          const fetcher = getFetcher(useV2)
          const safeOverview = await fetcher.getOverview({
            chainId,
            currency,
            walletAddress,
            safeAddress,
            dispatch: dispatch as StoreDispatch,
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

      try {
        // Group safes by whether they should use v2
        const v1Safes: string[] = []
        const v2Safes: string[] = []

        for (const safe of safes) {
          const safeId = makeSafeTag(safe.chainId, safe.address)
          if (shouldUseV2(state, safe.chainId)) {
            v2Safes.push(safeId)
          } else {
            v1Safes.push(safeId)
          }
        }

        // Fetch from both endpoints in parallel (store handles chunking internally)
        const queryParams = { currency, walletAddress }
        const results = await Promise.all([
          v1Safes.length > 0 ? executeQuery(dispatch as StoreDispatch, false, { safes: v1Safes, ...queryParams }) : [],
          v2Safes.length > 0 ? executeQuery(dispatch as StoreDispatch, true, { safes: v2Safes, ...queryParams }) : [],
        ])

        return { data: results.flat() }
      } catch (error) {
        return { error: { status: 'CUSTOM_ERROR', error: asError(error).message } }
      }
    },
  }),
})
