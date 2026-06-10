import { createListenerMiddleware } from '@reduxjs/toolkit'
import type { RootState } from '@/store/index'
import { removeUndeployedSafe } from '../undeployedSafesSlice'
import { enqueuePendingCfDelete } from '../pendingCfDeletesSlice'
import { counterfactualSyncListener } from '../counterfactualSyncListener'
import { cgwApi as counterfactualSafesApi } from '@safe-global/store/gateway/AUTO_GENERATED/counterfactual-safes'

// Build a thunk-shaped object whose dispatch result exposes .unwrap() like RTK Query's initiate thunk.
const makeInitiateMock = (unwrapResult: () => Promise<unknown>) =>
  jest.fn(() => {
    const action = { type: 'mock-delete-action' } as Record<string, unknown>
    // The listener awaits listenerApi.dispatch(initiate(...)).unwrap()
    // so the dispatched thunk must return an object exposing .unwrap().
    return Object.assign(action, { unwrap: unwrapResult })
  })

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/counterfactual-safes', () => ({
  cgwApi: {
    endpoints: {
      counterfactualSafesDeleteV1: {
        initiate: jest.fn(),
      },
    },
  },
}))

const initiateMock = counterfactualSafesApi.endpoints.counterfactualSafesDeleteV1.initiate as jest.Mock

describe('counterfactualSyncListener', () => {
  const listenerMiddlewareInstance = createListenerMiddleware<RootState>()

  // The listener captures its own getOriginalState via the middleware layer, so we
  // pass the *pre-action* state as `state` — it becomes both getState() and
  // getOriginalState() from the listener's point of view.
  const runListener = (
    state: RootState,
    action: ReturnType<typeof removeUndeployedSafe>,
    dispatchImpl: (thunk: unknown) => unknown = (t) => t,
  ) => {
    const listenerApi = {
      getState: jest.fn(() => state),
      dispatch: jest.fn(dispatchImpl),
    }
    return {
      listenerApi,
      result: listenerMiddlewareInstance.middleware(listenerApi)(jest.fn())(action),
    }
  }

  const authedState = (undeployedSafes: Record<string, unknown> = {}) =>
    ({
      auth: { sessionExpiresAt: Date.now() + 60_000 },
      undeployedSafes,
    }) as unknown as RootState

  beforeEach(() => {
    listenerMiddlewareInstance.clearListeners()
    counterfactualSyncListener(listenerMiddlewareInstance)
    jest.clearAllMocks()
    // Default: successful unwrap
    initiateMock.mockImplementation(makeInitiateMock(() => Promise.resolve({ ok: true })))
  })

  it('dispatches the delete API call when current user created the safe', async () => {
    const state = authedState({ '1': { '0x123': { isCreator: true } } })

    const { listenerApi } = runListener(state, removeUndeployedSafe({ chainId: '1', address: '0x123' }))
    await Promise.resolve()
    await Promise.resolve()

    expect(initiateMock).toHaveBeenCalledWith({
      deleteCounterfactualSafesDto: { safes: [{ chainId: '1', address: '0x123' }] },
    })
    expect(listenerApi.dispatch).toHaveBeenCalledTimes(1)
    const dispatched = listenerApi.dispatch.mock.calls[0][0] as { unwrap: unknown }
    expect(typeof dispatched.unwrap).toBe('function')
  })

  it('dispatches the delete API call for legacy entries without isCreator (treated as creator)', async () => {
    const state = authedState({
      '1': {
        '0x123': {
          /* isCreator undefined */
        },
      },
    })

    runListener(state, removeUndeployedSafe({ chainId: '1', address: '0x123' }))
    await Promise.resolve()
    await Promise.resolve()

    expect(initiateMock).toHaveBeenCalled()
  })

  it('does NOT dispatch the delete API call when current user is not the creator', async () => {
    const state = authedState({ '1': { '0x123': { isCreator: false } } })

    const { listenerApi } = runListener(state, removeUndeployedSafe({ chainId: '1', address: '0x123' }))
    await Promise.resolve()
    await Promise.resolve()

    expect(initiateMock).not.toHaveBeenCalled()
    expect(listenerApi.dispatch).not.toHaveBeenCalled()
  })

  it('swallows a backend DELETE failure and queues a retry', async () => {
    const state = authedState({ '1': { '0x123': { isCreator: true } } })

    const error = new Error('boom')
    initiateMock.mockImplementationOnce(makeInitiateMock(() => Promise.reject(error)))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const { listenerApi } = runListener(state, removeUndeployedSafe({ chainId: '1', address: '0x123' }))
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()

    expect(consoleSpy).toHaveBeenCalled()
    // Failure must enqueue a pending delete so the next sync retries — otherwise
    // the next GET would resurrect the activated safe as "Not activated".
    expect(listenerApi.dispatch).toHaveBeenCalledWith(enqueuePendingCfDelete({ chainId: '1', address: '0x123' }))
    consoleSpy.mockRestore()
  })

  it('queues a pending delete (instead of calling the API) when user is not authenticated', () => {
    const state = {
      auth: { sessionExpiresAt: null },
      undeployedSafes: { '1': { '0x123': { isCreator: true } } },
    } as unknown as RootState
    const { listenerApi } = runListener(state, removeUndeployedSafe({ chainId: '1', address: '0x123' }))

    expect(initiateMock).not.toHaveBeenCalled()
    expect(listenerApi.dispatch).toHaveBeenCalledTimes(1)
    expect(listenerApi.dispatch).toHaveBeenCalledWith(enqueuePendingCfDelete({ chainId: '1', address: '0x123' }))
  })

  it('queues a pending delete when sessionExpiresAt is in the past', () => {
    const state = {
      auth: { sessionExpiresAt: Date.now() - 60_000 },
      undeployedSafes: { '1': { '0x123': { isCreator: true } } },
    } as unknown as RootState
    const { listenerApi } = runListener(state, removeUndeployedSafe({ chainId: '1', address: '0x123' }))

    expect(initiateMock).not.toHaveBeenCalled()
    expect(listenerApi.dispatch).toHaveBeenCalledTimes(1)
    expect(listenerApi.dispatch).toHaveBeenCalledWith(enqueuePendingCfDelete({ chainId: '1', address: '0x123' }))
  })

  it('does NOT queue a pending delete for non-creators when unauthenticated', () => {
    const state = {
      auth: { sessionExpiresAt: null },
      undeployedSafes: { '1': { '0x123': { isCreator: false } } },
    } as unknown as RootState
    const { listenerApi } = runListener(state, removeUndeployedSafe({ chainId: '1', address: '0x123' }))

    expect(initiateMock).not.toHaveBeenCalled()
    expect(listenerApi.dispatch).not.toHaveBeenCalled()
  })
})
