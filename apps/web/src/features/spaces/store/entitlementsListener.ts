import { isAnyOf } from '@reduxjs/toolkit'
import type { listenerMiddlewareInstance } from '@/store/index'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { cgwApi as relayApi } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import { cgwApi as entitlementsApi } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import { getQuotaExceededError } from '@safe-global/utils/services/quotaErrors'

/**
 * No mutation's tags cover the seats and sponsored transactions a Workspace used: invalidate the entitlements when
 * Safes are added or removed, a sponsored relay lands, or either is refused with a 402 the cached meter let through.
 */
export const entitlementsListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  const create = spacesApi?.endpoints?.spaceSafesCreateV1
  const remove = spacesApi?.endpoints?.spaceSafesDeleteV1
  const relay = relayApi?.endpoints?.spaceRelayRelayV1
  // Tests that mock the spaces or relay module leave no endpoints to watch.
  if (!create || !remove || !relay) return

  const spent = isAnyOf(create.matchFulfilled, remove.matchFulfilled, relay.matchFulfilled)
  const refused = isAnyOf(create.matchRejected, relay.matchRejected)

  listenerMiddleware.startListening({
    predicate: (action) => spent(action) || (refused(action) && !!getQuotaExceededError(action.payload)),
    effect: (_, listenerApi) => {
      listenerApi.dispatch(entitlementsApi.util.invalidateTags(['entitlements']))
    },
  })
}
