import { type EndpointBuilder } from '@reduxjs/toolkit/query/react'

import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { RootState } from '../..'
import { selectCurrency } from '../../settingsSlice'
import { type SafeItem } from '@/features/myAccounts/hooks/useAllSafes'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { makeSafeTag } from '.'
import {
  additionalSafesRtkApi,
  additionalSafesRtkApiV2,
} from '@safe-global/store/gateway/safes'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { apiSliceWithChainsConfig } from '@safe-global/store/gateway/chains'

type MultiOverviewQueryParams = {
  currency: string
  walletAddress?: string
  safes: SafeItem[]
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

        // Check if the chain has the PORTFOLIO_ENDPOINT feature enabled
        const chainsSelector = apiSliceWithChainsConfig.endpoints.getChainsConfig.select(undefined)
        const chainsQueryResult = chainsSelector(state)
        const chain = chainsQueryResult.data?.entities[chainId]
        const useV2 = chain ? hasFeature(chain, FEATURES.PORTFOLIO_ENDPOINT) : false

        const safeId = makeSafeTag(chainId, safeAddress)

        try {
          // Choose v1 or v2 based on feature flag
          const endpoint = useV2
            ? additionalSafesRtkApiV2.endpoints.safesGetOverviewForManyV2
            : additionalSafesRtkApi.endpoints.safesGetOverviewForMany

          const queryThunk = endpoint.initiate({
            safes: [safeId],
            currency,
            walletAddress,
            trusted: false,
            excludeSpam: true,
          })
          const queryAction = dispatch(queryThunk)

          try {
            const result = await queryAction.unwrap()
            const safeOverview = result[0]
            return { data: safeOverview ?? null }
          } finally {
            queryAction.unsubscribe()
          }
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

      // Check feature flag for current chain
      const chainsSelector = apiSliceWithChainsConfig.endpoints.getChainsConfig.select(undefined)
      const chainsQueryResult = chainsSelector(state)
      const firstChainId = safes[0].chainId
      const chain = chainsQueryResult.data?.entities[firstChainId]
      const useV2 = chain ? hasFeature(chain, FEATURES.PORTFOLIO_ENDPOINT) : false

      const safeIds = safes.map((safe) => makeSafeTag(safe.chainId, safe.address))

      try {
        // Choose v1 or v2 based on feature flag
        const endpoint = useV2
          ? additionalSafesRtkApiV2.endpoints.safesGetOverviewForManyV2
          : additionalSafesRtkApi.endpoints.safesGetOverviewForMany

        const queryThunk = endpoint.initiate({
          safes: safeIds,
          currency,
          walletAddress,
          trusted: false,
          excludeSpam: true,
        })
        const queryAction = dispatch(queryThunk)

        try {
          const result = await queryAction.unwrap()
          return { data: result }
        } finally {
          queryAction.unsubscribe()
        }
      } catch (error) {
        return { error: { status: 'CUSTOM_ERROR', error: (error as Error).message } }
      }
    },
  }),
})
