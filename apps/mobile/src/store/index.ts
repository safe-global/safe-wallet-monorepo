import {
  combineReducers,
  configureStore,
  createListenerMiddleware,
  ListenerEffectAPI,
  TypedStartListening,
} from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import { reduxStorage } from './storage'
import txHistory from './txHistorySlice'
import activeSafe from './activeSafeSlice'
import activeSigner from './activeSignerSlice'
import signers from './signersSlice'
import delegates from './delegatesSlice'
import myAccounts from './myAccountsSlice'
import notifications from './notificationsSlice'
import addressBook from './addressBookSlice'
import settings from './settingsSlice'
import safes from './safesSlice'
import safeSubscriptions from './safeSubscriptionsSlice'
import biometrics from './biometricsSlice'
import pendingTxs from './pendingTxsSlice'
import { cgwClient, setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import devToolsEnhancer from 'redux-devtools-expo-dev-plugin'
import { GATEWAY_URL, isTestingEnv } from '../config/constants'
import { web3API } from './signersBalance'
import { setBaseUrl as setSDKBaseURL } from '@safe-global/safe-gateway-typescript-sdk'
import { createFilter } from '@safe-global/store/utils/persistTransformFilter'
import { setupMobileCookieHandling } from './utils/cookieHandling'
import notificationsMiddleware from './middleware/notifications'
import analyticsMiddleware from './middleware/analytics'
import notificationSyncMiddleware from './middleware/notificationSync'
import { setBackendStore } from '@/src/store/utils/singletonStore'
import pendingTxsListeners from '@/src/store/middleware/pendingTxs'

setSDKBaseURL(GATEWAY_URL)
setBaseUrl(GATEWAY_URL)

// Set up mobile-specific cookie handling
setupMobileCookieHandling()

const cgwClientFilter = createFilter(
  cgwClient.reducerPath,
  ['queries.getChainsConfig(undefined)', 'config'],
  ['queries.getChainsConfig(undefined)', 'config'],
)

const persistConfig = {
  key: 'root',
  version: 1,
  storage: reduxStorage,
  blacklist: [web3API.reducerPath, cgwClient.reducerPath, 'myAccounts'],
  transforms: [cgwClientFilter],
}

export const rootReducer = combineReducers({
  txHistory,
  safes,
  activeSigner,
  activeSafe,
  notifications,
  addressBook,
  myAccounts,
  signers,
  delegates,
  settings,
  safeSubscriptions,
  biometrics,
  pendingTxs,
  [web3API.reducerPath]: web3API.reducer,
  [cgwClient.reducerPath]: cgwClient.reducer,
})

// Define the type for the root reducer
export type RootReducerState = ReturnType<typeof rootReducer>

// Use the persistReducer with the correct types
const persistedReducer = persistReducer<RootReducerState>(persistConfig, rootReducer)

export type AppStartListening = TypedStartListening<RootState, AppDispatch>
export type AppListenerEffectAPI = ListenerEffectAPI<RootState, AppDispatch>
export const listenerMiddlewareInstance = createListenerMiddleware<RootState>()
export const startAppListening = listenerMiddlewareInstance.startListening as AppStartListening

const listeners = [pendingTxsListeners]

export const makeStore = () =>
  configureStore({
    reducer: persistedReducer,
    devTools: false,
    middleware: (getDefaultMiddleware) => {
      listeners.forEach((listener) => listener(startAppListening))

      return getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(
        cgwClient.middleware,
        web3API.middleware,
        notificationsMiddleware,
        analyticsMiddleware,
        notificationSyncMiddleware,
        listenerMiddlewareInstance.middleware,
      )
    },

    enhancers: (getDefaultEnhancers) => {
      if (isTestingEnv) {
        return getDefaultEnhancers()
      }

      return getDefaultEnhancers().concat(devToolsEnhancer({ maxAge: 200 }))
    },
  })

export const store = makeStore()
// we are going around a circular dependency here
setBackendStore(store)

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
