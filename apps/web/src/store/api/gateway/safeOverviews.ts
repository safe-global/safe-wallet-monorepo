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

type SafeOverviewResolver = {
  resolve: (overview: SafeOverview | undefined) => void
  reject: (error: Error) => void
}

type PendingSafeOverviewRequest = {
  chainId: string
  safeAddress: string
  resolvers: SafeOverviewResolver[]
}

type SafeOverviewBatchState = {
  pending: Map<string, PendingSafeOverviewRequest>
  inFlight: Map<string, PendingSafeOverviewRequest> | null
  scheduled: boolean
  currency: string
  walletAddress?: string
}

class SafeOverviewFetcher {
  private queues = new Map<SafesGetOverviewForManyDispatch, Map<string, SafeOverviewBatchState>>()

  private getQueueKey(currency: string, walletAddress?: string) {
    return `${currency}|${walletAddress ?? ''}`
  }

  private ensureQueueState(
    dispatch: SafesGetOverviewForManyDispatch,
    currency: string,
    walletAddress?: string,
  ): { queueState: SafeOverviewBatchState; key: string } {
    let queueMap = this.queues.get(dispatch)

    if (!queueMap) {
      queueMap = new Map<string, SafeOverviewBatchState>()
      this.queues.set(dispatch, queueMap)
    }

    const key = this.getQueueKey(currency, walletAddress)

    let queueState = queueMap.get(key)

    if (!queueState) {
      queueState = {
        pending: new Map<string, PendingSafeOverviewRequest>(),
        inFlight: null,
        scheduled: false,
        currency,
        walletAddress,
      }

      queueMap.set(key, queueState)
    }

    return { queueState, key }
  }

  private cleanupIfIdle(dispatch: SafesGetOverviewForManyDispatch, key: string) {
    const queueMap = this.queues.get(dispatch)

    if (!queueMap) {
      return
    }

    const queueState = queueMap.get(key)

    if (!queueState) {
      return
    }

    if (queueState.pending.size === 0 && queueState.inFlight === null && !queueState.scheduled) {
      queueMap.delete(key)

      if (queueMap.size === 0) {
        this.queues.delete(dispatch)
      }
    }
  }

  private scheduleBatch(dispatch: SafesGetOverviewForManyDispatch, key: string, queueState: SafeOverviewBatchState) {
    if (queueState.inFlight || queueState.scheduled || queueState.pending.size === 0) {
      return
    }

    queueState.scheduled = true

    Promise.resolve().then(() => {
      queueState.scheduled = false
      void this.runBatch(dispatch, key)
    })
  }

  private async runBatch(dispatch: SafesGetOverviewForManyDispatch, key: string) {
    const queueMap = this.queues.get(dispatch)
    const queueState = queueMap?.get(key)

    if (!queueState || queueState.inFlight || queueState.pending.size === 0) {
      this.cleanupIfIdle(dispatch, key)
      return
    }

    const batch = new Map(queueState.pending)
    queueState.pending.clear()
    queueState.inFlight = batch

    const fetchSafeOverviews = createFetchSafeOverviews(dispatch)
    const safeTags = Array.from(batch.values()).map((request) => makeSafeTag(request.chainId, request.safeAddress))

    try {
      const overviews = await fetchSafeOverviews({
        safes: safeTags,
        currency: queueState.currency,
        walletAddress: queueState.walletAddress,
      })

      for (const request of batch.values()) {
        const overview = overviews.find(
          (entry) => entry.chainId === request.chainId && sameAddress(entry.address.value, request.safeAddress),
        )

        request.resolvers.forEach((resolver) => {
          resolver.resolve(overview)
        })
      }
    } catch (error) {
      const rejectionError = new Error('Could not fetch Safe overview')

      const rejection = error instanceof Error ? error : rejectionError

      for (const request of batch.values()) {
        request.resolvers.forEach((resolver) => {
          resolver.reject(rejection)
        })
      }
    } finally {
      for (const request of batch.values()) {
        request.resolvers.length = 0
      }

      queueState.inFlight = null

      if (queueState.pending.size > 0) {
        this.scheduleBatch(dispatch, key, queueState)
      } else {
        this.cleanupIfIdle(dispatch, key)
      }
    }
  }

  async getOverview({
    chainId,
    safeAddress,
    currency,
    walletAddress,
    dispatch,
  }: SafeOverviewQueueItem & { dispatch: SafesGetOverviewForManyDispatch }) {
    return await new Promise<SafeOverview | undefined>((resolve, reject) => {
      const { queueState, key } = this.ensureQueueState(dispatch, currency, walletAddress)
      const safeTag = makeSafeTag(chainId, safeAddress)
      const resolver: SafeOverviewResolver = { resolve, reject }

      if (queueState.inFlight?.has(safeTag)) {
        queueState.inFlight.get(safeTag)?.resolvers.push(resolver)
        return
      }

      let pendingRequest = queueState.pending.get(safeTag)

      if (!pendingRequest) {
        pendingRequest = {
          chainId,
          safeAddress,
          resolvers: [],
        }

        queueState.pending.set(safeTag, pendingRequest)
      }

      pendingRequest.resolvers.push(resolver)

      this.scheduleBatch(dispatch, key, queueState)
    })
  }
}

type SafeOverviewQueueItem = {
  safeAddress: string
  walletAddress?: string
  chainId: string
  currency: string
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
