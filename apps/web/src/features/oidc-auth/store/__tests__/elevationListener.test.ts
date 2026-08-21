import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import type { UnknownAction } from '@reduxjs/toolkit'
import { elevationListener } from '../elevationListener'
import { stepUpSlice } from '../stepUpSlice'
import { ELEVATION_REQUIRED_ERROR } from '../../utils/elevation'

const mockSavePendingStepUpAction = jest.fn()

jest.mock('../../utils/stepUpReplay', () => ({
  getReplayableAction: jest.requireActual('../../utils/stepUpReplay').getReplayableAction,
  savePendingStepUpAction: (action: unknown) => mockSavePendingStepUpAction(action),
}))

// Mirrors how RTK Query reports a baseQuery failure: a rejected thunk action
// whose payload is the FetchBaseQueryError. `requestId` and `requestStatus` are
// part of the shape RTK's `isRejectedWithValue` matcher keys on, so omitting
// them would make the listener silently never fire.
const rejectedWithValue = (payload: unknown, endpointName = 'spaceSafesCreateV1', originalArgs: unknown = {}) =>
  ({
    type: 'cgwClient/executeMutation/rejected',
    payload,
    error: { message: 'Rejected' },
    meta: {
      requestId: 'test-request-id',
      requestStatus: 'rejected',
      rejectedWithValue: true,
      arg: { type: 'mutation', endpointName, originalArgs },
    },
  }) as UnknownAction

const createTestStore = () => {
  const listenerMiddleware = createListenerMiddleware()
  elevationListener(listenerMiddleware as unknown as Parameters<typeof elevationListener>[0])

  return configureStore({
    reducer: { [stepUpSlice.name]: stepUpSlice.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware),
  })
}

type TestStore = ReturnType<typeof createTestStore>
const phaseOf = (store: TestStore) => store.getState()[stepUpSlice.name].phase

const ELEVATION_REQUIRED = { status: 403, data: { message: ELEVATION_REQUIRED_ERROR } }

describe('elevationListener', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should start a step-up when a request needs a fresh second factor', () => {
    const store = createTestStore()

    store.dispatch(rejectedWithValue(ELEVATION_REQUIRED))

    expect(phaseOf(store)).toBe('leaving')
  })

  it('should store the interrupted request so it can be completed on the way back', () => {
    const originalArgs = { spaceId: '42', createSpaceSafesDto: { safes: [{ chainId: '1', address: '0xabc' }] } }

    createTestStore().dispatch(rejectedWithValue(ELEVATION_REQUIRED, 'spaceSafesCreateV1', originalArgs))

    expect(mockSavePendingStepUpAction).toHaveBeenCalledWith({ endpoint: 'spaceSafesCreateV1', args: originalArgs })
  })

  // A route CGW does not gate has no business being replayed on a redirect, but
  // the user still needs elevating to get anywhere.
  it('should not store a request for an endpoint outside the gated set', () => {
    const store = createTestStore()

    store.dispatch(rejectedWithValue(ELEVATION_REQUIRED, 'spacesGetOneV1'))

    expect(mockSavePendingStepUpAction).not.toHaveBeenCalled()
    expect(phaseOf(store)).toBe('leaving')
  })

  it.each([
    ['an unrelated 403', { status: 403, data: { message: 'Signer address not authorized' } }],
    ['a 401', { status: 401, data: { message: 'Unauthorized' } }],
    ['a network failure', { status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' }],
  ])('should ignore %s', (_label, payload) => {
    const store = createTestStore()

    store.dispatch(rejectedWithValue(payload))

    expect(phaseOf(store)).toBe('idle')
    expect(mockSavePendingStepUpAction).not.toHaveBeenCalled()
  })
})
