import { isAnyOf } from '@reduxjs/toolkit'
import type { listenerMiddlewareInstance } from '@/store/index'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { cgwApi as entitlementsApi } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'

/**
 * Adding or removing Safes changes the seats in use, which only the entitlements report and whose tag the Safes
 * mutations do not invalidate: invalidate it as soon as such a change lands, so every meter moves at once.
 */
export const spaceSafesEntitlementsListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  const create = spacesApi?.endpoints?.spaceSafesCreateV1?.matchFulfilled
  const remove = spacesApi?.endpoints?.spaceSafesDeleteV1?.matchFulfilled
  // Tests that mock the spaces module leave no endpoints to watch.
  if (!create || !remove) return

  listenerMiddleware.startListening({
    matcher: isAnyOf(create, remove),
    effect: (_, listenerApi) => {
      listenerApi.dispatch(entitlementsApi.util.invalidateTags(['entitlements']))
    },
  })
}
