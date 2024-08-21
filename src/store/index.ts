import {
  configureStore,
  combineReducers,
  createListenerMiddleware,
  type ThunkAction,
  type PreloadedState,
  type AnyAction,
} from '@reduxjs/toolkit'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import merge from 'lodash/merge'
import { IS_PRODUCTION } from '@/config/constants'
import { getPreloadedState, persistState } from './persistStore'
import { broadcastState, listenToBroadcast } from './broadcast'
import { safeMessagesListener, txHistoryListener, txQueueListener } from './slices'
import * as slices from './slices'
import * as hydrate from './useHydrateStore'

const rootReducer = combineReducers({
  [slices.chainsSlice.name]: slices.chainsSlice.reducer,
  [slices.superChainAccountSlice.name]: slices.superChainAccountSlice.reducer,
  [slices.safeInfoSlice.name]: slices.safeInfoSlice.reducer,
  [slices.balancesSlice.name]: slices.balancesSlice.reducer,
  [slices.sessionSlice.name]: slices.sessionSlice.reducer,
  [slices.txHistorySlice.name]: slices.txHistorySlice.reducer,
  [slices.txQueueSlice.name]: slices.txQueueSlice.reducer,
  [slices.addressBookSlice.name]: slices.addressBookSlice.reducer,
  [slices.notificationsSlice.name]: slices.notificationsSlice.reducer,
  [slices.pendingTxsSlice.name]: slices.pendingTxsSlice.reducer,
  [slices.addedSafesSlice.name]: slices.addedSafesSlice.reducer,
  [slices.settingsSlice.name]: slices.settingsSlice.reducer,
  [slices.cookiesSlice.name]: slices.cookiesSlice.reducer,
  [slices.popupSlice.name]: slices.popupSlice.reducer,
  [slices.spendingLimitSlice.name]: slices.spendingLimitSlice.reducer,
  [slices.safeAppsSlice.name]: slices.safeAppsSlice.reducer,
  [slices.safeMessagesSlice.name]: slices.safeMessagesSlice.reducer,
  [slices.pendingSafeMessagesSlice.name]: slices.pendingSafeMessagesSlice.reducer,
  [slices.batchSlice.name]: slices.batchSlice.reducer,
  [slices.undeployedSafesSlice.name]: slices.undeployedSafesSlice.reducer,
  [slices.contactsSlice.name]: slices.contactsSlice.reducer,
})

const persistedSlices: (keyof PreloadedState<RootState>)[] = [
  slices.sessionSlice.name,
  slices.addressBookSlice.name,
  slices.contactsSlice.name,
  slices.pendingTxsSlice.name,
  slices.addedSafesSlice.name,
  slices.settingsSlice.name,
  slices.cookiesSlice.name,
  slices.safeAppsSlice.name,
  slices.pendingSafeMessagesSlice.name,
  slices.batchSlice.name,
  slices.undeployedSafesSlice.name,
]

export const getPersistedState = () => {
  return getPreloadedState(persistedSlices)
}

export const listenerMiddlewareInstance = createListenerMiddleware<RootState>()

const middleware = [
  persistState(persistedSlices),
  broadcastState(persistedSlices),
  listenerMiddlewareInstance.middleware,
]
const listeners = [safeMessagesListener, txHistoryListener, txQueueListener]

export const _hydrationReducer: typeof rootReducer = (state, action) => {
  if (action.type === hydrate.HYDRATE_ACTION) {
    /**
     * When changing the schema of a Redux slice, previously stored data in LS might become incompatible.
     * To avoid this, we should always migrate the data on a case-by-case basis in the corresponding slice.
     * However, as a catch-all measure, we attempt to merge the stored data with the initial Redux state,
     * so that any newly added properties in the initial state are preserved, and existing properties are taken from the LS.
     *
     * @see https://lodash.com/docs/4.17.15#merge
     */

    return merge({}, state, action.payload)
  }
  return rootReducer(state, action)
}

export const makeStore = (initialState?: Record<string, any>) => {
  const store = configureStore({
    reducer: _hydrationReducer,
    middleware: (getDefaultMiddleware) => {
      listeners.forEach((listener) => listener(listenerMiddlewareInstance))
      return getDefaultMiddleware({ serializableCheck: false }).concat(middleware)
    },
    devTools: !IS_PRODUCTION,
    preloadedState: initialState,
  })

  listenToBroadcast(store)

  return store
}

export type AppDispatch = ReturnType<typeof makeStore>['dispatch']
export type RootState = ReturnType<typeof _hydrationReducer>

export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export const useHydrateStore = hydrate.useHydrateStore
