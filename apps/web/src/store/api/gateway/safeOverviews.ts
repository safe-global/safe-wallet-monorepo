import { type EndpointBuilder } from '@reduxjs/toolkit/query/react'

import type { SafeOverview, SafesGetSafeOverviewV1ApiResponse } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { additionalSafesRtkApi } from '@safe-global/store/gateway/safes'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { RootState } from '../..'
import { selectCurrency } from '../../settingsSlice'
import { type SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { makeSafeTag } from '.'

const SAFE_OVERVIEW_QUERY_OPTIONS = {
  trusted: false,
  excludeSpam: true,
}

type SafeOverviewQueryArgs = {
  safes: string[]
  currency: string
  walletAddress?: string
}

type SafeOverviewQueryFn = (args: SafeOverviewQueryArgs) => Promise<SafesGetSafeOverviewV1ApiResponse>

type SafesGetOverviewForManyQueryResult = ReturnType<
  ReturnType<typeof additionalSafesRtkApi.endpoints.safesGetOverviewForMany.initiate>
>

type SafesGetOverviewForManyDispatch = (
  action: ReturnType<typeof additionalSafesRtkApi.endpoints.safesGetOverviewForMany.initiate>,
) => SafesGetOverviewForManyQueryResult

const createFetchSafeOverviews = (dispatch: SafesGetOverviewForManyDispatch): SafeOverviewQueryFn => {
  return async ({ safes, currency, walletAddress }) => {
    const queryAction = additionalSafesRtkApi.endpoints.safesGetOverviewForMany.initiate(
      {
        safes,
        currency,
        walletAddress,
        trusted: SAFE_OVERVIEW_QUERY_OPTIONS.trusted,
        excludeSpam: SAFE_OVERVIEW_QUERY_OPTIONS.excludeSpam,
      },
      { subscribe: false },
    )

    const queryResult: SafesGetOverviewForManyQueryResult = dispatch(queryAction)

    try {
      return await queryResult.unwrap()
    } finally {
      queryResult.unsubscribe()
    }
  }
}

type SafeOverviewQueueItem = {
  safeAddress: string
  walletAddress?: string
  chainId: string
  currency: string
  dispatch: SafesGetOverviewForManyDispatch
  callback: (result: { data: SafeOverview | undefined; error?: never } | { data?: never; error: string }) => void
}

type SafeOverviewQueueState = {
  items: SafeOverviewQueueItem[]
  timeout: NodeJS.Timeout | null
  processing: boolean
}

const BATCH_SIZE = 10
const FETCH_DELAY_MS = 300

class SafeOverviewFetcher {
  private queues = new Map<SafesGetOverviewForManyDispatch, Map<string, SafeOverviewQueueState>>()

  private getQueueKey(currency: string, walletAddress?: string) {
    return `${currency}|${walletAddress ?? ''}`
  }

  private ensureQueueState(
    dispatch: SafesGetOverviewForManyDispatch,
    currency: string,
    walletAddress?: string,
  ): { queueState: SafeOverviewQueueState; key: string } {
    let queueMap = this.queues.get(dispatch)

    if (!queueMap) {
      queueMap = new Map<string, SafeOverviewQueueState>()
      this.queues.set(dispatch, queueMap)
    }

    const key = this.getQueueKey(currency, walletAddress)

    let queueState = queueMap.get(key)

    if (!queueState) {
      queueState = {
        items: [],
        timeout: null,
        processing: false,
      }

      queueMap.set(key, queueState)
    }

    return { queueState, key }
  }

  private enqueueRequest(item: SafeOverviewQueueItem) {
    const { queueState, key } = this.ensureQueueState(item.dispatch, item.currency, item.walletAddress)

    queueState.items.push(item)

    if (queueState.items.length >= BATCH_SIZE) {
      void this.processQueue(item.dispatch, key)
      return
    }

    if (!queueState.processing && queueState.timeout === null) {
      queueState.timeout = setTimeout(() => {
        queueState.timeout = null
        void this.processQueue(item.dispatch, key)
      }, FETCH_DELAY_MS)
    }
  }

  private async processQueue(dispatch: SafesGetOverviewForManyDispatch, key: string) {
    const queueMap = this.queues.get(dispatch)
    const queueState = queueMap?.get(key)

    if (!queueState || queueState.processing) {
      return
    }

    queueState.processing = true

    if (queueState.timeout) {
      clearTimeout(queueState.timeout)
      queueState.timeout = null
    }

    while (queueState.items.length > 0) {
      const nextBatch = queueState.items.splice(0, BATCH_SIZE)

      if (nextBatch.length === 0) {
        continue
      }

      try {
        const { currency, walletAddress } = nextBatch[0]
        const fetchSafeOverviews = createFetchSafeOverviews(dispatch)
        const safeTags = nextBatch.map((request) => makeSafeTag(request.chainId, request.safeAddress))
        const overviews = await fetchSafeOverviews({ safes: safeTags, currency, walletAddress })

        nextBatch.forEach((request) => {
          const overview = overviews.find(
            (entry) => entry.chainId === request.chainId && sameAddress(entry.address.value, request.safeAddress),
          )

          request.callback({ data: overview })
        })
      } catch (error) {
        nextBatch.forEach((request) => request.callback({ error: 'Could not fetch Safe overview' }))
      }
    }

    queueState.processing = false

    if (queueState.items.length > 0) {
      void this.processQueue(dispatch, key)
      return
    }

    const queueMapForDispatch = this.queues.get(dispatch)

    queueMapForDispatch?.delete(key)

    if (queueMapForDispatch && queueMapForDispatch.size === 0) {
      this.queues.delete(dispatch)
    }
  }

  async getOverview(item: Omit<SafeOverviewQueueItem, 'callback'>) {
    return await new Promise<SafeOverview | undefined>((resolve, reject) => {
      this.enqueueRequest({
        ...item,
        callback: (result) => {
          if ('data' in result) {
            resolve(result.data)
          } else {
            reject(new Error(result.error))
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

export const safeOverviewEndpoints = (builder: EndpointBuilder<any, 'OwnedSafes' | 'Submissions', 'gatewayApi'>) => ({
  getSafeOverview: builder.query<SafeOverview | null, { safeAddress: string; walletAddress?: string; chainId: string }>(
    {
      async queryFn({ safeAddress, walletAddress, chainId }, { getState, dispatch }) {
        const state = getState() as RootState
        const currency = selectCurrency(state)

        if (!safeAddress) {
          return { data: null }
        }

        try {
          const safeOverview = await batchedFetcher.getOverview({
            chainId,
            currency,
            walletAddress,
            safeAddress,
            dispatch,
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

      try {
        if (!safes.length) {
          return { data: [] }
        }

        const promisedSafeOverviews = safes.map((safe) =>
          batchedFetcher.getOverview({
            chainId: safe.chainId,
            safeAddress: safe.address,
            currency,
            walletAddress,
            dispatch,
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
