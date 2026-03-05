import { type EndpointBuilder } from '@reduxjs/toolkit/query/react'

import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { selectCurrency } from '../../settingsSlice'
import { type SafeItem } from '@/hooks/safes'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { makeSafeTag } from '.'
import { additionalSafesRtkApi } from '@safe-global/store/gateway/safes'

type InitiateThunk = ReturnType<typeof additionalSafesRtkApi.endpoints.safesGetOverviewForMany.initiate>
type QueryActionResult = ReturnType<InitiateThunk>
type DispatchFn = (action: InitiateThunk) => QueryActionResult

type SafeOverviewQueueItem = {
  safeAddress: string
  walletAddress?: string
  chainId: string
  currency: string
  dispatch: DispatchFn
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
    dispatch,
  }: {
    safeIds: `${number}:0x${string}`[]
    walletAddress?: string
    currency: string
    dispatch: DispatchFn
  }) {
    const queryThunk = additionalSafesRtkApi.endpoints.safesGetOverviewForMany.initiate({
      safes: safeIds,
      currency,
      walletAddress,
      trusted: false,
    })
    const queryAction = dispatch(queryThunk)

    try {
      return await queryAction.unwrap()
    } finally {
      queryAction.unsubscribe()
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

    const { walletAddress, currency, dispatch } = itemsToProcess[0]

    try {
      const overviews = await this.fetchSafeOverviews({
        safeIds: itemsToProcess.map((item) => makeSafeTag(item.chainId, item.safeAddress)),
        currency,
        walletAddress,
        dispatch,
      })

      itemsToProcess.forEach((item) => {
        const overview = overviews.find(
          (entry) =>
            entry != null && sameAddress(entry.address?.value, item.safeAddress) && entry.chainId === item.chainId,
        )
        item.callback({ data: overview })
      })
    } catch {
      itemsToProcess.forEach((item) => item.callback({ error: 'Could not fetch Safe overview' }))
    }
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

export const safeOverviewEndpoints = (builder: EndpointBuilder<any, 'Submissions', 'gatewayApi'>) => ({
  getSafeOverview: builder.query<SafeOverview | null, { safeAddress: string; walletAddress?: string; chainId: string }>(
    {
      async queryFn({ safeAddress, walletAddress, chainId }, { getState, dispatch }) {
        const currency = selectCurrency(getState() as never)
        const dispatchFn: DispatchFn = (action) => dispatch(action)

        if (!safeAddress) {
          return { data: null }
        }

        try {
          const safeOverview = await batchedFetcher.getOverview({
            chainId,
            currency,
            walletAddress,
            safeAddress,
            dispatch: dispatchFn,
          })
          return { data: safeOverview ?? null }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: asError(error).message } }
        }
      },
    },
  ),
  getMultipleSafeOverviews: builder.query<SafeOverview[], MultiOverviewQueryParams>({
    async queryFn(params, { dispatch }) {
      const { safes, walletAddress, currency } = params
      const dispatchFn: DispatchFn = (action) => dispatch(action)

      if (safes.length === 0) {
        return { data: [] }
      }

      try {
        const promisedSafeOverviews = safes.map((safe) =>
          batchedFetcher.getOverview({
            chainId: safe.chainId,
            safeAddress: safe.address,
            currency,
            walletAddress,
            dispatch: dispatchFn,
          }),
        )

        // Use Promise.allSettled to preserve successful results when some safes fail
        const results = await Promise.allSettled(promisedSafeOverviews)
        const safeOverviews = results
          .filter((result): result is PromiseFulfilledResult<SafeOverview | undefined> => result.status === 'fulfilled')
          .map((result) => result.value)
          .filter((overview): overview is SafeOverview => overview !== undefined)

        return { data: safeOverviews }
      } catch (error) {
        return { error: { status: 'CUSTOM_ERROR', error: asError(error).message } }
      }
    },
  }),
})
