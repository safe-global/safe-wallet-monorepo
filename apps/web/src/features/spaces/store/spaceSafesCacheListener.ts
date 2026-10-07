import type { listenerMiddlewareInstance } from '@/store/index'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { GetSpaceSafeResponse, SpaceSafeDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

/** Adds each Safe to the list of its chain, unless that chain already lists its address. */
export const addSafesToSpaceSafes = (spaceSafes: GetSpaceSafeResponse, safes: SpaceSafeDto[]): void => {
  for (const { chainId, address } of safes) {
    const chainSafes = (spaceSafes.safes[chainId] ??= [])
    const isListed = chainSafes.some((listed) => listed.toLowerCase() === address.toLowerCase())
    if (!isListed) chainSafes.push(address)
  }
}

/**
 * The `spaces` invalidation can wait for other requests, so a Safe page opened right after an add
 * would read the old list and lose its Workspace. Writing the added Safes into the cache closes that gap.
 */
export const spaceSafesCacheListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  const create = spacesApi?.endpoints?.spaceSafesCreateV1?.matchFulfilled
  // Tests that mock the spaces module leave no endpoints to watch.
  if (!create) return

  listenerMiddleware.startListening({
    matcher: create,
    effect: (action, listenerApi) => {
      const { spaceId, createSpaceSafesDto } = action.meta.arg.originalArgs
      listenerApi.dispatch(
        spacesApi.util.updateQueryData('spaceSafesGetV1', { spaceId }, (draft) =>
          addSafesToSpaceSafes(draft, createSpaceSafesDto.safes),
        ),
      )
    },
  })
}
