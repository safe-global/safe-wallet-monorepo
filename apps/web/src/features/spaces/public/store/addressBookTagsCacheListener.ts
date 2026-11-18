import type { listenerMiddlewareInstance } from '@/store/index'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

/** The create returns the whole book; caching it keeps a new tag selectable before the refetch lands. */
export const addressBookTagsCacheListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  const create = spacesApi?.endpoints?.addressBooksCreateTagV1?.matchFulfilled
  // Tests that mock the spaces module leave no endpoints to watch.
  if (!create) return

  listenerMiddleware.startListening({
    matcher: create,
    effect: (action, listenerApi) => {
      const { spaceId } = action.meta.arg.originalArgs
      listenerApi.dispatch(
        spacesApi.util.upsertQueryData('addressBooksGetAddressBookItemsV1', { spaceId }, action.payload),
      )
    },
  })
}
