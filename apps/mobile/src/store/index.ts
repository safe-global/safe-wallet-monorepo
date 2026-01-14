import {
  combineReducers,
  configureStore,
  createListenerMiddleware,
  ListenerEffectAPI,
  TypedStartListening,
} from '@reduxjs/toolkit'
import {
  persistStore,
  persistReducer,
  createTransform,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist'
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
import safesSettings from './safesSettingsSlice'
import biometrics from './biometricsSlice'
import pendingTxs from './pendingTxsSlice'
import estimatedFee from './estimatedFeeSlice'
import executionMethod from './executionMethodSlice'
import { cgwClient, setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import devToolsEnhancer from 'redux-devtools-expo-dev-plugin'
import { GATEWAY_URL, isTestingEnv } from '../config/constants'
import { web3API } from './signersBalance'
import { createFilter } from '@safe-global/store/utils/persistTransformFilter'
import { setupMobileCookieHandling } from './utils/cookieHandling'
import notificationsMiddleware from './middleware/notifications'
import analyticsMiddleware from './middleware/analytics'
import notificationSyncMiddleware from './middleware/notificationSync'
import { setBackendStore } from '@/src/store/utils/singletonStore'
import pendingTxsListeners from '@/src/store/middleware/pendingTxs'
import signingState from './signingStateSlice'
import signerImportFlow from './signerImportFlowSlice'
import executingState from './executingStateSlice'

setBaseUrl(GATEWAY_URL)

// Set up mobile-specific cookie handling
setupMobileCookieHandling()

export const cgwClientFilter = createFilter(
  cgwClient.reducerPath,
  ['queries.getChainsConfig(undefined)', 'config'],
  ['queries.getChainsConfig(undefined)', 'config'],
)

type QueryEntry = { status?: string } | undefined
type RtkQueryState = {
  queries?: Record<string, QueryEntry>
  [key: string]: unknown
}

// RTK Query persists status: 'pending' for in-flight requests. If the app is killed mid-request,
// this stale pending status prevents new requests from being initiated on restart.
export const sanitizePendingQueriesTransform = createTransform<RtkQueryState, RtkQueryState>(
  (inboundState) => inboundState,
  (outboundState) => {
    if (!outboundState?.queries) {
      return outboundState
    }

    const sanitizedQueries: Record<string, QueryEntry> = {}
    for (const [key, query] of Object.entries(outboundState.queries)) {
      if (query?.status === 'pending') {
        continue
      }
      sanitizedQueries[key] = query
    }

    return { ...outboundState, queries: sanitizedQueries }
  },
  { whitelist: [cgwClient.reducerPath] },
)

export const persistBlacklist = [
  web3API.reducerPath,
  'myAccounts',
  'estimatedFee',
  'executionMethod',
  'signingState',
  'signerImportFlow',
  'executingState',
]

export const persistTransforms = [cgwClientFilter, sanitizePendingQueriesTransform]

const persistConfig = {
  key: 'root',
  version: 1,
  storage: reduxStorage,
  blacklist: persistBlacklist,
  transforms: persistTransforms,
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
  safesSettings,
  safeSubscriptions,
  biometrics,
  pendingTxs,
  estimatedFee,
  executionMethod,
  signingState,
  signerImportFlow,
  executingState,
  [web3API.reducerPath]: web3API.reducer,
  [cgwClient.reducerPath]: cgwClient.reducer,
  [hypernativeApi.reducerPath]: hypernativeApi.reducer,
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
          ignoredPaths: ['estimatedFee'],
          // this fixes the issue with non-serializable values in the app
          ignoredActionPaths: [
            'payload.maxFeePerGas',
            'payload.maxPriorityFeePerGas',
            'payload.gasLimit',
            'meta.baseQueryMeta.request',
            'meta.baseQueryMeta.response',
          ],
        },
      }).concat(
        cgwClient.middleware,
        web3API.middleware,
        hypernativeApi.middleware,
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
