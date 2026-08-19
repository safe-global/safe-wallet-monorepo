import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import type { UnknownAction } from '@reduxjs/toolkit'
import { elevationListener } from '../elevationListener'
import { ELEVATION_REQUIRED_ERROR } from '../../utils/elevation'

const mockStartStepUp = jest.fn()
const mockSavePendingStepUpAction = jest.fn()

jest.mock('../../utils/stepUp', () => ({
  startStepUp: () => mockStartStepUp(),
}))

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
    reducer: { noop: () => null },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware),
  })
}

const ELEVATION_REQUIRED = { status: 403, data: { message: ELEVATION_REQUIRED_ERROR } }

describe('elevationListener', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should send the user to the provider when a request needs a fresh second factor', () => {
    createTestStore().dispatch(rejectedWithValue(ELEVATION_REQUIRED))

    expect(mockStartStepUp).toHaveBeenCalledTimes(1)
  })

  it('should store the interrupted request so it can be completed on the way back', () => {
    const originalArgs = { spaceId: '42', createSpaceSafesDto: { safes: [{ chainId: '1', address: '0xabc' }] } }

    createTestStore().dispatch(rejectedWithValue(ELEVATION_REQUIRED, 'spaceSafesCreateV1', originalArgs))

    expect(mockSavePendingStepUpAction).toHaveBeenCalledWith({ endpoint: 'spaceSafesCreateV1', args: originalArgs })
  })

  // A route CGW does not gate has no business being replayed on a redirect.
  it('should not store a request for an endpoint outside the gated set', () => {
    createTestStore().dispatch(rejectedWithValue(ELEVATION_REQUIRED, 'spacesGetOneV1'))

    expect(mockSavePendingStepUpAction).not.toHaveBeenCalled()
    expect(mockStartStepUp).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['an unrelated 403', { status: 403, data: { message: 'Signer address not authorized' } }],
    ['a 401', { status: 401, data: { message: 'Unauthorized' } }],
    ['a network failure', { status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' }],
  ])('should ignore %s', (_label, payload) => {
    createTestStore().dispatch(rejectedWithValue(payload))

    expect(mockStartStepUp).not.toHaveBeenCalled()
    expect(mockSavePendingStepUpAction).not.toHaveBeenCalled()
  })
})
