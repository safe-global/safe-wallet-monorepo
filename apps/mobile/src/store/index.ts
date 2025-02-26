import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import { reduxStorage } from './storage'
import txHistory from './txHistorySlice'
import activeSafe from './activeSafeSlice'
import activeSigner from './activeSignerSlice'
import signers from './signersSlice'
import myAccounts from './myAccountsSlice'
import notifications from './notificationsSlice'
import settings from './settingsSlice'
import safes from './safesSlice'
import { cgwClient, setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import devToolsEnhancer from 'redux-devtools-expo-dev-plugin'
import { GATEWAY_URL, isTestingEnv } from '../config/constants'
import { signersBalanceApi } from './signersBalance'

setBaseUrl(GATEWAY_URL)
const persistConfig = {
  key: 'root',
  version: 1,
  storage: reduxStorage,
  blacklist: [cgwClient.reducerPath, signersBalanceApi.reducerPath, 'myAccounts'],
}

export const rootReducer = combineReducers({
  txHistory,
  safes,
  activeSigner,
  activeSafe,
  notifications,
  myAccounts,
  signers,
  settings,
  [signersBalanceApi.reducerPath]: signersBalanceApi.reducer,
  [cgwClient.reducerPath]: cgwClient.reducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const makeStore = () =>
  configureStore({
    reducer: persistedReducer,
    devTools: false,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(cgwClient.middleware, signersBalanceApi.middleware),
    enhancers: (getDefaultEnhancers) => {
      if (isTestingEnv) {
        return getDefaultEnhancers()
      }

      return getDefaultEnhancers().concat(devToolsEnhancer())
    },
  })

export const store = makeStore()

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
