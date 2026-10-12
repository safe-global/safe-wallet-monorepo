import { isAnyOf } from '@reduxjs/toolkit'
import type { listenerMiddlewareInstance } from '@/store/index'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { cgwApi as entitlementsApi } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'

/** The Safes mutations don't invalidate the entitlements tag, yet they change the seats in use. */
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
