import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import type { UnknownAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store/index'
import {
  clearElevationRequired,
  elevationListener,
  elevationSlice,
  requireElevation,
  selectIsElevationRequired,
} from '../elevationSlice'
import { ELEVATION_REQUIRED_ERROR } from '../../utils/elevation'

// Mirrors how RTK Query reports a baseQuery failure: a rejected thunk action
// whose payload is the FetchBaseQueryError. `requestId` and `requestStatus` are
// part of the shape RTK's `isRejectedWithValue` matcher keys on, so omitting
// them would make the listener silently never fire.
const rejectedWithValue = (payload: unknown): UnknownAction => ({
  type: 'cgwClient/executeMutation/rejected',
  payload,
  error: { message: 'Rejected' },
  meta: { requestId: 'test-request-id', requestStatus: 'rejected', rejectedWithValue: true },
})

// The store under test holds only the elevation slice, so the listener
// middleware is typed to that shape; `elevationListener` itself is declared
// against the full RootState.
type TestState = { [elevationSlice.name]: ReturnType<typeof elevationSlice.reducer> }

const createTestStore = () => {
  const listenerMiddleware = createListenerMiddleware<TestState>()
  elevationListener(listenerMiddleware as unknown as Parameters<typeof elevationListener>[0])

  return configureStore({
    reducer: { [elevationSlice.name]: elevationSlice.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(listenerMiddleware.middleware),
  })
}

type TestStore = ReturnType<typeof createTestStore>
const isRequired = (store: TestStore) => selectIsElevationRequired(store.getState() as unknown as RootState)

describe('elevationSlice', () => {
  it('should start with no elevation required', () => {
    expect(isRequired(createTestStore())).toBe(false)
  })

  it('should require elevation on requireElevation', () => {
    const store = createTestStore()
    store.dispatch(requireElevation())
    expect(isRequired(store)).toBe(true)
  })

  it('should clear the requirement on clearElevationRequired', () => {
    const store = createTestStore()
    store.dispatch(requireElevation())
    store.dispatch(clearElevationRequired())
    expect(isRequired(store)).toBe(false)
  })
})

describe('elevationListener', () => {
  it('should require elevation when a request is rejected with elevation_required', () => {
    const store = createTestStore()

    store.dispatch(rejectedWithValue({ status: 403, data: { message: ELEVATION_REQUIRED_ERROR } }))

    expect(isRequired(store)).toBe(true)
  })

  it.each([
    ['an unrelated 403', { status: 403, data: { message: 'Signer address not authorized' } }],
    ['a 401', { status: 401, data: { message: 'Unauthorized' } }],
    ['a network failure', { status: 'FETCH_ERROR', error: 'TypeError: Failed to fetch' }],
  ])('should not require elevation for %s', (_label, payload) => {
    const store = createTestStore()

    store.dispatch(rejectedWithValue(payload))

    expect(isRequired(store)).toBe(false)
  })
})
