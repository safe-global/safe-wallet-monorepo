import { createListenerMiddleware } from '@reduxjs/toolkit'
import type { RootState } from '@/store/index'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { cgwApi as entitlementsApi } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import { entitlementsListener } from '../entitlementsListener'

const quotaExceeded = { status: 402, data: { code: 'QUOTA_EXCEEDED', feature: 'safe_seats', quota: 2, used: 2 } }

const mutation = (endpointName: string, requestStatus: 'fulfilled' | 'rejected', payload: unknown = {}) => ({
  type: `${spacesApi.reducerPath}/executeMutation/${requestStatus}`,
  payload,
  meta: {
    requestId: 'r1',
    requestStatus,
    rejectedWithValue: requestStatus === 'rejected',
    arg: { type: 'mutation', endpointName, originalArgs: { spaceId: 's1' } },
  },
})

describe('entitlementsListener', () => {
  const listenerMiddleware = createListenerMiddleware<RootState>()
  const dispatch = jest.fn()
  const run = (action: ReturnType<typeof mutation>) =>
    listenerMiddleware.middleware({ getState: jest.fn(), dispatch })(jest.fn())(action)

  beforeEach(() => {
    listenerMiddleware.clearListeners()
    entitlementsListener(listenerMiddleware)
    jest.clearAllMocks()
  })

  it.each(['spaceSafesCreateV1', 'spaceSafesDeleteV1', 'spaceRelayRelayV1'])(
    'invalidates the entitlements after %s succeeds',
    (endpoint) => {
      run(mutation(endpoint, 'fulfilled'))

      expect(dispatch).toHaveBeenCalledWith(entitlementsApi.util.invalidateTags(['entitlements']))
    },
  )

  it.each(['spaceSafesCreateV1', 'spaceRelayRelayV1'])(
    'invalidates the entitlements when %s is refused for a spent quota',
    (endpoint) => {
      run(mutation(endpoint, 'rejected', quotaExceeded))

      expect(dispatch).toHaveBeenCalledWith(entitlementsApi.util.invalidateTags(['entitlements']))
    },
  )

  it('ignores other failures and other endpoints', () => {
    run(mutation('spaceSafesCreateV1', 'rejected', { status: 500, data: {} }))
    run(mutation('spaceRelayRelayV1', 'rejected', { status: 422, data: { code: 'SIMULATION_FAILED' } }))
    run(mutation('spaceSafesDeleteV1', 'rejected', quotaExceeded))
    run(mutation('relayRelayV1', 'fulfilled'))
    run(mutation('spacesUpdateV1', 'fulfilled'))

    expect(dispatch).not.toHaveBeenCalled()
  })

  it('registers nothing when the spaces endpoints are unavailable', () => {
    const startListening = jest.fn()
    jest.isolateModules(() => {
      jest.doMock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({ cgwApi: {} }))
      const { entitlementsListener: isolated } = require('../entitlementsListener')
      isolated({ startListening })
    })
    jest.dontMock('@safe-global/store/gateway/AUTO_GENERATED/spaces')

    expect(startListening).not.toHaveBeenCalled()
  })
})
