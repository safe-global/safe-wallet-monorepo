import type { listenerMiddlewareInstance } from '@/store/index'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

/**
 * The tag pickers drop a ticked id the address book doesn't list, and the refetch after a create
 * can lag, so a new tag would vanish from the selection and be left out of the save. The create
 * returns the whole address book; writing it into the cache closes that gap.
 */
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
