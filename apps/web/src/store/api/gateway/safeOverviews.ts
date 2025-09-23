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

const createFetchSafeOverviews = (dispatch: (action: unknown) => unknown): SafeOverviewQueryFn => {
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

    const queryResult = dispatch(queryAction) as SafesGetOverviewForManyQueryResult

    try {
      return await queryResult.unwrap()
    } finally {
      queryResult.unsubscribe()
    }
  }
}

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
          const fetchSafeOverviews = createFetchSafeOverviews(dispatch)
          const safes = [makeSafeTag(chainId, safeAddress)]
          const overviews = await fetchSafeOverviews({ safes, currency, walletAddress })
          const safeOverview = overviews.find(
            (entry) => entry.chainId === chainId && sameAddress(entry.address.value, safeAddress),
          )

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

        const fetchSafeOverviews = createFetchSafeOverviews(dispatch)
        const safeTags = safes.map((safe) => makeSafeTag(safe.chainId, safe.address))
        const overviews = await fetchSafeOverviews({ safes: safeTags, currency, walletAddress })

        const matchingOverviews = overviews.filter((overview) =>
          safes.some((safe) => safe.chainId === overview.chainId && sameAddress(safe.address, overview.address.value)),
        )

        return { data: matchingOverviews }
      } catch (error) {
        return { error: { status: 'CUSTOM_ERROR', error: (error as Error).message } }
      }
    },
  }),
})
