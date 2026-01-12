import { type EndpointBuilder } from '@reduxjs/toolkit/query/react'
import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'

import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
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
 * Get the appropriate endpoint based on the v2 feature flag.
 */
function getOverviewEndpoint(useV2: boolean) {
  return useV2
    ? additionalSafesRtkApiV2.endpoints.safesGetOverviewForManyV2
    : additionalSafesRtkApi.endpoints.safesGetOverviewForMany
}

/**
 * Execute a query and return the result, ensuring proper cleanup.
 */
async function executeOverviewQuery(
  dispatch: StoreDispatch,
  useV2: boolean,
  params: { safes: string[]; currency: string; walletAddress?: string },
): Promise<SafeOverview[]> {
  const endpoint = getOverviewEndpoint(useV2)
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
 * These are simple wrappers that check the feature flag and call the appropriate store endpoint.
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
          const safeId = makeSafeTag(chainId, safeAddress)
          const result = await executeOverviewQuery(dispatch as StoreDispatch, useV2, {
            safes: [safeId],
            currency,
            walletAddress,
          })
          return { data: result[0] ?? null }
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

        // Fetch from both endpoints in parallel if needed
        const queryParams = { currency, walletAddress }
        const results = await Promise.all([
          v1Safes.length > 0
            ? executeOverviewQuery(dispatch as StoreDispatch, false, { safes: v1Safes, ...queryParams })
            : [],
          v2Safes.length > 0
            ? executeOverviewQuery(dispatch as StoreDispatch, true, { safes: v2Safes, ...queryParams })
            : [],
        ])

        return { data: results.flat() }
      } catch (error) {
        return { error: { status: 'CUSTOM_ERROR', error: asError(error).message } }
      }
    },
  }),
})
