import type { listenerMiddlewareInstance } from '@/store'
import { setTokenList } from '@/store/settingsSlice'
import { gatewayApi } from '.'
import { hasPortfolioSummariesChain } from './safeOverviews'

/** Overviews read the token list inside their query, not in their cache key: refetch them when it changes. */
export const safeOverviewsTokenListListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({
    actionCreator: setTokenList,
    effect: (_action, listenerApi) => {
      if (!hasPortfolioSummariesChain(listenerApi.getState())) return
      listenerApi.dispatch(gatewayApi.util.invalidateTags(['SafeOverviews']))
    },
  })
}
