import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import type { UnknownAction } from '@reduxjs/toolkit'
import { elevationListener } from '../elevationListener'
import { stepUpSlice } from '../stepUpSlice'
import { ELEVATION_REQUIRED_ERROR } from '../../utils/elevation'

const mockSaveStepUpTrip = jest.fn()
const mockIsStepUpReturnInFlight = jest.fn()

jest.mock('../../utils/stepUpReplay', () => ({
  getReplayableAction: jest.requireActual('../../utils/stepUpReplay').getReplayableAction,
  saveStepUpTrip: (action: unknown) => mockSaveStepUpTrip(action),
}))

jest.mock('../../utils/stepUp', () => ({
  isStepUpReturnInFlight: () => mockIsStepUpReturnInFlight(),
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
    mockIsStepUpReturnInFlight.mockReturnValue(false)
  })

  it('should, when a request needs a fresh second factor, start a step-up', () => {
    const store = createTestStore()

    store.dispatch(rejectedWithValue(ELEVATION_REQUIRED))

    expect(phaseOf(store)).toBe('leaving')
  })

  it('should, when a gated mutation is rejected, store the interrupted request so it can be completed on the way back', () => {
    const originalArgs = { spaceId: '42', createSpaceSafesDto: { safes: [{ chainId: '1', address: '0xabc' }] } }

    createTestStore().dispatch(rejectedWithValue(ELEVATION_REQUIRED, 'spaceSafesCreateV1', originalArgs))

    expect(mockSaveStepUpTrip).toHaveBeenCalledWith({ endpoint: 'spaceSafesCreateV1', args: originalArgs })
  })

  // A route CGW does not gate has no business being replayed on a redirect, but
  // the user still needs elevating to get anywhere.
  it('should, when the endpoint is outside the gated set, record a bare trip and still elevate', () => {
    const store = createTestStore()

    store.dispatch(rejectedWithValue(ELEVATION_REQUIRED, 'spacesGetOneV1'))

    expect(mockSaveStepUpTrip).toHaveBeenCalledWith(undefined)
    expect(phaseOf(store)).toBe('leaving')
  })

  // A challenge raised by the replayed action itself must surface inline, not
  // record a new trip and bounce back out to the provider.
  it('should, when a return is being processed, do nothing', () => {
    mockIsStepUpReturnInFlight.mockReturnValue(true)
    const store = createTestStore()

    store.dispatch(rejectedWithValue(ELEVATION_REQUIRED))

    expect(mockSaveStepUpTrip).not.toHaveBeenCalled()
    expect(phaseOf(store)).toBe('idle')
  })

  it('should, when the rejection is an unrelated 403, ignore it', () => {
    const store = createTestStore()

    store.dispatch(rejectedWithValue({ status: 403, data: { message: 'Signer address not authorized' } }))

    expect(phaseOf(store)).toBe('idle')
    expect(mockSaveStepUpTrip).not.toHaveBeenCalled()
  })

  it('should, when the rejection is a 401, ignore it', () => {
    const store = createTestStore()

    store.dispatch(rejectedWithValue({ status: 401, data: { message: 'Unauthorized' } }))

    expect(phaseOf(store)).toBe('idle')
    expect(mockSaveStepUpTrip).not.toHaveBeenCalled()
  })

  it('should, when the rejection is a network failure, ignore it', () => {
    const store = createTestStore()

    store.dispatch(rejectedWithValue({ status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' }))

    expect(phaseOf(store)).toBe('idle')
    expect(mockSaveStepUpTrip).not.toHaveBeenCalled()
  })
})
