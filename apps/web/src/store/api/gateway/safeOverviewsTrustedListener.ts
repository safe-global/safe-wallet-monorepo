import type { ListenerEffect, ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { apiSliceWithChainsConfig } from '@safe-global/store/gateway'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { CONFIG_SERVICE_KEY } from '@/config/constants'
import type { listenerMiddlewareInstance, RootState } from '@/store'
import { gatewayApi } from '.'

const { getChainsConfigV2 } = apiSliceWithChainsConfig.endpoints

// Module-level predicate and effect, so a second store (tests) re-registers this listener instead of adding one
const isChainsLoaded = (action: UnknownAction) => getChainsConfigV2.matchFulfilled(action)

const refetchOverviewsWithTrusted: ListenerEffect<
  UnknownAction,
  RootState,
  ThunkDispatch<RootState, unknown, UnknownAction>
> = (action, listenerApi) => {
  if (!getChainsConfigV2.matchFulfilled(action)) return
  const hadChains = getChainsConfigV2.select(CONFIG_SERVICE_KEY)(listenerApi.getOriginalState()).data !== undefined
  const readsSummaries = Object.values(action.payload.entities).some(
    (chain) => chain !== undefined && hasFeature(chain, FEATURES.PORTFOLIO_SUMMARIES),
  )
  if (hadChains || !readsSummaries) return

  listenerApi.dispatch(gatewayApi.util.invalidateTags(['SafeOverviews']))
}

/** Refetches overviews sent before the first chain configs arrived (trusted=false) once a chain reads summaries. */
export const safeOverviewsTrustedListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({ predicate: isChainsLoaded, effect: refetchOverviewsWithTrusted })
}
