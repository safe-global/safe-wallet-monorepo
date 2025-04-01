import {
  configureStore,
  combineReducers,
  createListenerMiddleware,
  type ThunkAction,
  type Action,
  type Middleware,
  type EnhancedStore,
  type ThunkDispatch,
} from '@reduxjs/toolkit'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import merge from 'lodash/merge'
import { IS_PRODUCTION } from '@/config/constants'
import { getPreloadedState, persistState } from './persistStore'
import { broadcastState, listenToBroadcast } from './broadcast'
import {
  cookiesAndTermsSlice,
  cookiesAndTermsInitialState,
  safeMessagesListener,
  swapOrderListener,
  swapOrderStatusListener,
  txHistoryListener,
  txQueueListener,
  authListener,
} from './slices'
import * as slices from './slices'
import * as hydrate from './useHydrateStore'
import { ofacApi } from '@/store/api/ofac'
import { safePassApi } from './api/safePass'
import { version as termsVersion } from '@/markdown/terms/version'
import { cgwClient, setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import { GATEWAY_URL } from '@/config/gateway'
import { setupListeners } from '@reduxjs/toolkit/query'

const rootReducer = combineReducers({
  [slices.chainsSlice.name]: slices.chainsSlice.reducer,
  [slices.safeInfoSlice.name]: slices.safeInfoSlice.reducer,
  [slices.balancesSlice.name]: slices.balancesSlice.reducer,
  [slices.sessionSlice.name]: slices.sessionSlice.reducer,
  [slices.txHistorySlice.name]: slices.txHistorySlice.reducer,
  [slices.txQueueSlice.name]: slices.txQueueSlice.reducer,
  [slices.swapOrderSlice.name]: slices.swapOrderSlice.reducer,
  [slices.addressBookSlice.name]: slices.addressBookSlice.reducer,
  [slices.notificationsSlice.name]: slices.notificationsSlice.reducer,
  [slices.pendingTxsSlice.name]: slices.pendingTxsSlice.reducer,
  [slices.addedSafesSlice.name]: slices.addedSafesSlice.reducer,
  [slices.settingsSlice.name]: slices.settingsSlice.reducer,
  [slices.cookiesAndTermsSlice.name]: slices.cookiesAndTermsSlice.reducer,
  [slices.popupSlice.name]: slices.popupSlice.reducer,
  [slices.spendingLimitSlice.name]: slices.spendingLimitSlice.reducer,
  [slices.safeAppsSlice.name]: slices.safeAppsSlice.reducer,
  [slices.safeMessagesSlice.name]: slices.safeMessagesSlice.reducer,
  [slices.pendingSafeMessagesSlice.name]: slices.pendingSafeMessagesSlice.reducer,
  [slices.batchSlice.name]: slices.batchSlice.reducer,
  [slices.undeployedSafesSlice.name]: slices.undeployedSafesSlice.reducer,
  [slices.swapParamsSlice.name]: slices.swapParamsSlice.reducer,
  [slices.visitedSafesSlice.name]: slices.visitedSafesSlice.reducer,
  [slices.orderByPreferenceSlice.name]: slices.orderByPreferenceSlice.reducer,
  [ofacApi.reducerPath]: ofacApi.reducer,
  [safePassApi.reducerPath]: safePassApi.reducer,
  [slices.gatewayApi.reducerPath]: slices.gatewayApi.reducer,
  [cgwClient.reducerPath]: cgwClient.reducer,
  [slices.authSlice.reducerPath]: slices.authSlice.reducer,
})

const persistedSlices: (keyof Partial<RootState>)[] = [
  slices.sessionSlice.name,
  slices.addressBookSlice.name,
  slices.pendingTxsSlice.name,
  slices.addedSafesSlice.name,
  slices.settingsSlice.name,
  slices.cookiesAndTermsSlice.name,
  slices.safeAppsSlice.name,
  slices.pendingSafeMessagesSlice.name,
  slices.batchSlice.name,
  slices.undeployedSafesSlice.name,
  slices.swapParamsSlice.name,
  slices.swapOrderSlice.name,
  slices.visitedSafesSlice.name,
  slices.orderByPreferenceSlice.name,
  slices.authSlice.name,
]

export const getPersistedState = () => {
  return getPreloadedState(persistedSlices)
}

export const listenerMiddlewareInstance = createListenerMiddleware<RootState>()

const middleware: Middleware<{}, RootState>[] = [
  persistState(persistedSlices),
  broadcastState(persistedSlices),
  listenerMiddlewareInstance.middleware,
  ofacApi.middleware,
  safePassApi.middleware,
  slices.gatewayApi.middleware,
]

const listeners = [
  safeMessagesListener,
  txHistoryListener,
  txQueueListener,
  swapOrderListener,
  swapOrderStatusListener,
  authListener,
]

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
    const nextState = merge({}, state, action.payload) as RootState

    // Check if termsVersion matches
    if (nextState[cookiesAndTermsSlice.name] && nextState[cookiesAndTermsSlice.name].termsVersion !== termsVersion) {
      // Reset consent
      nextState[cookiesAndTermsSlice.name] = {
        ...cookiesAndTermsInitialState,
      }
    }

    return nextState
  }
  return rootReducer(state, action) as RootState
}

type MakeStoreOptions = {
  skipBroadcast?: boolean
}
export const makeStore = (
  initialState?: Partial<RootState>,
  options?: MakeStoreOptions,
): EnhancedStore<RootState, Action> => {
  setBaseUrl(GATEWAY_URL)

  const store = configureStore({
    reducer: _hydrationReducer,
    middleware: (getDefaultMiddleware) => {
      listeners.forEach((listener) => listener(listenerMiddlewareInstance))
      return getDefaultMiddleware({ serializableCheck: false }).concat(cgwClient.middleware).concat(middleware)
    },
    devTools: !IS_PRODUCTION,
    preloadedState: initialState,
  })

  if (!options?.skipBroadcast) {
    listenToBroadcast(store)
  }

  setupListeners(store.dispatch)

  return store
}

export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = ThunkDispatch<RootState, unknown, Action> & EnhancedStore<RootState, Action>['dispatch']
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action>

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export const useHydrateStore = hydrate.useHydrateStore
