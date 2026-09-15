import { configureStore } from '@reduxjs/toolkit'
import type { BaseQueryApi, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { stepUpResponseHook } from '../stepUpResponseHook'
import { stepUpReturning, stepUpSlice } from '../stepUpSlice'
import { ELEVATION_REQUIRED_ERROR } from '../../utils/elevation'

const mockSaveStepUpTrip = jest.fn()

jest.mock('../../utils/stepUpReplay', () => ({
  toReplayableRequest: jest.requireActual('../../utils/stepUpReplay').toReplayableRequest,
  saveStepUpTrip: (action: unknown) => mockSaveStepUpTrip(action),
}))

const ELEVATION_REQUIRED: FetchBaseQueryError = { status: 403, data: { message: ELEVATION_REQUIRED_ERROR } }
const REQUEST = { url: '/v1/spaces/7/safes', method: 'POST', body: { safes: [] } }

const createTestStore = () => configureStore({ reducer: { [stepUpSlice.name]: stepUpSlice.reducer } })

type TestStore = ReturnType<typeof createTestStore>
const phaseOf = (store: TestStore) => store.getState()[stepUpSlice.name].phase

const callHook = (store: TestStore, endpoint: string, error?: FetchBaseQueryError) => {
  const api = {
    dispatch: store.dispatch,
    getState: store.getState,
    endpoint,
    type: 'mutation',
    signal: new AbortController().signal,
    abort: jest.fn(),
    extra: undefined,
  } as BaseQueryApi

  return stepUpResponseHook(new Response(), REQUEST.url, { api, args: REQUEST, error })
}

/** A never-settling promise loses the race against one that settles on the next tick. */
const settlesSoon = (value: unknown) =>
  Promise.race([Promise.resolve(value).then(() => 'settled'), new Promise((r) => setTimeout(() => r('pending'), 10))])

describe('stepUpResponseHook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should, when a request needs a fresh second factor, save the trip, start the step-up and hold the request open', async () => {
    const store = createTestStore()

    const result = callHook(store, 'spaceSafesCreateV1', ELEVATION_REQUIRED)

    expect(mockSaveStepUpTrip).toHaveBeenCalledWith({ endpoint: 'spaceSafesCreateV1', request: REQUEST })
    expect(phaseOf(store)).toBe('leaving')
    await expect(settlesSoon(result)).resolves.toBe('pending')
  })

  it('should, when the rejected endpoint cannot be replayed, save a bare trip and still start the step-up', () => {
    const store = createTestStore()

    callHook(store, 'spacesCreateV1', ELEVATION_REQUIRED)

    expect(mockSaveStepUpTrip).toHaveBeenCalledWith(undefined)
    expect(phaseOf(store)).toBe('leaving')
  })

  it('should, when the request failed for another reason, let it settle untouched', () => {
    const store = createTestStore()

    const result = callHook(store, 'spaceSafesCreateV1', { status: 403, data: { message: 'Not an admin' } })

    expect(result).toBeUndefined()
    expect(mockSaveStepUpTrip).not.toHaveBeenCalled()
    expect(phaseOf(store)).toBe('idle')
  })

  it('should, when the request succeeded, do nothing', () => {
    const store = createTestStore()

    expect(callHook(store, 'spaceSafesCreateV1')).toBeUndefined()
    expect(mockSaveStepUpTrip).not.toHaveBeenCalled()
  })

  it('should, when the replayed request is rejected again on return, let it settle so no second trip starts', () => {
    const store = createTestStore()
    store.dispatch(stepUpReturning())

    const result = callHook(store, 'spaceSafesCreateV1', ELEVATION_REQUIRED)

    expect(result).toBeUndefined()
    expect(mockSaveStepUpTrip).not.toHaveBeenCalled()
    expect(phaseOf(store)).toBe('returning')
  })
})
