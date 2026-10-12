import { createListenerMiddleware } from '@reduxjs/toolkit'
import type { RootState } from '@/store/index'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { cgwApi as entitlementsApi } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import { spaceSafesEntitlementsListener } from '../spaceSafesEntitlementsListener'

const mutation = (endpointName: string, requestStatus: 'fulfilled' | 'rejected') => ({
  type: `${spacesApi.reducerPath}/executeMutation/${requestStatus}`,
  payload: {},
  meta: { requestId: 'r1', requestStatus, arg: { type: 'mutation', endpointName, originalArgs: { spaceId: 's1' } } },
})

describe('spaceSafesEntitlementsListener', () => {
  const listenerMiddleware = createListenerMiddleware<RootState>()
  const dispatch = jest.fn()
  const run = (action: ReturnType<typeof mutation>) =>
    listenerMiddleware.middleware({ getState: jest.fn(), dispatch })(jest.fn())(action)

  beforeEach(() => {
    listenerMiddleware.clearListeners()
    spaceSafesEntitlementsListener(listenerMiddleware)
    jest.clearAllMocks()
  })

  it.each(['spaceSafesCreateV1', 'spaceSafesDeleteV1'])(
    'invalidates the entitlements after %s succeeds',
    (endpoint) => {
      run(mutation(endpoint, 'fulfilled'))

      expect(dispatch).toHaveBeenCalledWith(entitlementsApi.util.invalidateTags(['entitlements']))
    },
  )

  it('ignores failed changes and other endpoints', () => {
    run(mutation('spaceSafesCreateV1', 'rejected'))
    run(mutation('spacesUpdateV1', 'fulfilled'))

    expect(dispatch).not.toHaveBeenCalled()
  })
})
