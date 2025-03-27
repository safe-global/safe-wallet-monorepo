import { type EndpointBuilder } from '@reduxjs/toolkit/query/react'

import { type SafeOverview, getSafeOverviews } from '@safe-global/safe-gateway-typescript-sdk'
import { sameAddress } from '@/utils/addresses'
import type { RootState } from '../..'
import { selectCurrency } from '../../settingsSlice'
import { type SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import { asError } from '@/services/exceptions/utils'
import { makeSafeTag } from '.'

type SafeOverviewQueueItem = {
  safeAddress: string
  walletAddress?: string
  chainId: string
  currency: string
  callback: (result: { data: SafeOverview | undefined; error?: never } | { data?: never; error: string }) => void
}

const _BATCH_SIZE = 10
const _FETCH_TIMEOUT = 300

class SafeOverviewFetcher {
  private requestQueue: SafeOverviewQueueItem[] = []

  private fetchTimeout: NodeJS.Timeout | null = null

  private async fetchSafeOverviews({
    safeIds,
    walletAddress,
    currency,
  }: {
    safeIds: `${number}:0x${string}`[]
    walletAddress?: string
    currency: string
  }) {
    return await getSafeOverviews(safeIds, {
      /**
       * This flag can only be set once for all cross chain `safeIds`.
       * If we set `trusted` to `true` we will get 0 as `fiatTotal` for all Safes on networks without Default tokenlists.
       */
      trusted: false,
      exclude_spam: true,
      currency,
      wallet_address: walletAddress,
    })
  }

  private async processQueuedItems() {
    // Dequeue the first BATCH_SIZE items
    const nextBatch = this.requestQueue.slice(0, _BATCH_SIZE)
    this.requestQueue = this.requestQueue.slice(_BATCH_SIZE)

    let overviews: SafeOverview[]
    try {
      this.fetchTimeout && clearTimeout(this.fetchTimeout)
      this.fetchTimeout = null

      if (nextBatch.length === 0) {
        // Nothing to process
        return
      }

      const safeIds = nextBatch.map((request) => makeSafeTag(request.chainId, request.safeAddress))
      const { walletAddress, currency } = nextBatch[0]
      overviews = await this.fetchSafeOverviews({ safeIds, currency, walletAddress })
    } catch (err) {
      // Overviews could not be fetched
      nextBatch.forEach((item) => item.callback({ error: 'Could not fetch Safe overview' }))
      return
    }

    nextBatch.forEach((item) => {
      const overview = overviews.find(
        (entry) => sameAddress(entry.address.value, item.safeAddress) && entry.chainId === item.chainId,
      )

      item.callback({ data: overview })
    })
  }

  private enqueueRequest(item: SafeOverviewQueueItem) {
    this.requestQueue.push(item)

    if (this.requestQueue.length >= _BATCH_SIZE) {
      this.processQueuedItems()
    }

    // If no timer is running start a timer
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
          }
          reject(result.error)
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

export const safeOverviewEndpoints = (builder: EndpointBuilder<any, 'OwnedSafes' | 'Submissions', 'gatewayApi'>) => ({
  getSafeOverview: builder.query<SafeOverview | null, { safeAddress: string; walletAddress?: string; chainId: string }>(
    {
      async queryFn({ safeAddress, walletAddress, chainId }, { getState }) {
        const state = getState() as RootState
        const currency = selectCurrency(state)

        if (!safeAddress) {
          return { data: null }
        }

        try {
          const safeOverview = await batchedFetcher.getOverview({ chainId, currency, walletAddress, safeAddress })
          return { data: safeOverview ?? null }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: asError(error).message } }
        }
      },
    },
  ),
  getMultipleSafeOverviews: builder.query<SafeOverview[], MultiOverviewQueryParams>({
    async queryFn(params) {
      const { safes, walletAddress, currency } = params

      try {
        const promisedSafeOverviews = safes.map((safe) =>
          batchedFetcher.getOverview({
            chainId: safe.chainId,
            safeAddress: safe.address,
            currency,
            walletAddress,
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
