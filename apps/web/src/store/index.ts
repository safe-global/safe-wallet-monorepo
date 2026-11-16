import {
  configureStore,
  combineReducers,
  createListenerMiddleware,
  type ThunkAction,
  type Action,
  type Middleware,
} from '@reduxjs/toolkit'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import { useEffect } from 'react'
import merge from 'lodash/merge'
import { APP_ENV, IS_PRODUCTION, CONFIG_SERVICE_KEY } from '@/config/constants'
import { getPreloadedState, persistState } from './persistStore'
import { broadcastState, listenToBroadcast } from './broadcast'
import { cookiesAndTermsSlice, cookiesAndTermsInitialState } from '@/store/cookiesAndTermsSlice'
import { safeMessagesListener } from '@/store/safeMessagesSlice'
import { safeInfoListener } from '@/store/safeInfoSlice'
import { swapOrderListener, swapOrderStatusListener } from '@/store/swapOrderSlice'
import { txHistoryListener } from '@/store/txHistorySlice'
import { txQueueListener } from '@/store/txQueueSlice'
import { authListener } from '@/store/authSlice'
import { counterfactualSyncListener } from '@/features/counterfactual/store/counterfactualSyncListener'
import { addressBookListener } from '@/store/addressBookSlice'
import { spaceSafesEntitlementsListener } from '@/features/spaces/store/spaceSafesEntitlementsListener'
import { planChangeSyncListener } from '@/features/spaces/store/planChangeSyncListener'
import { checkoutTrackingListener } from '@/features/spaces/store/checkoutTrackingListener'
import { workspaceTrackingListener } from '@/features/spaces/store/workspaceTrackingListener'
import { spaceSafesCacheListener } from '@/features/spaces/store/spaceSafesCacheListener'
import { addressBookTagsCacheListener } from '@/features/spaces/store/addressBookTagsCacheListener'
import { trialReminderListener } from '@/features/spaces/store/trialReminder'
import * as slicesSafeInfoSlice from '@/store/safeInfoSlice'
import * as slicesSessionSlice from '@/store/sessionSlice'
import * as slicesTxHistorySlice from '@/store/txHistorySlice'
import * as slicesTxQueueSlice from '@/store/txQueueSlice'
import * as slicesSwapOrderSlice from '@/store/swapOrderSlice'
import * as slicesAddressBookSlice from '@/store/addressBookSlice'
import * as slicesNotificationsSlice from '@/store/notificationsSlice'
import * as slicesPendingTxsSlice from '@/store/pendingTxsSlice'
import * as slicesAddedSafesSlice from '@/store/addedSafesSlice'
import * as slicesSettingsSlice from '@/store/settingsSlice'
import * as slicesCookiesAndTermsSlice from '@/store/cookiesAndTermsSlice'
import * as slicesPopupSlice from '@/store/popupSlice'
import * as spendingLimitsSlice from '@/features/spending-limits/store/spendingLimitsSlice'
import * as slicesSafeAppsSlice from '@/store/safeAppsSlice'
import * as slicesPendingSafeMessagesSlice from '@/store/pendingSafeMessagesSlice'
import * as slicesBatchSlice from '@/features/batching/store/batchSlice'
import * as slicesUndeployedSafesSlice from '@/features/counterfactual/store/undeployedSafesSlice'
import * as slicesPendingCfDeletesSlice from '@/features/counterfactual/store/pendingCfDeletesSlice'
import * as slicesSwapParamsSlice from '@/features/swap/store/swapParamsSlice'
import * as slicesVisitedSafesSlice from '@/store/visitedSafesSlice'
import * as slicesOrderByPreferenceSlice from '@/store/orderByPreferenceSlice'
import * as slicesHnStateSlice from '@/features/hypernative/store/hnStateSlice'
import * as slicesHnQueueAssessmentsSlice from '@/features/hypernative/store/hnQueueAssessmentsSlice'
import * as slicesCalendlySlice from '@/features/hypernative/store/calendlySlice'
import * as slicesGlobalSearchSlice from '@/features/global-search/store/globalSearchSlice'
import * as slicesSafeActionsModalSlice from '@/features/spaces/store/safeActionsModalSlice'
import * as slicesSpaceNavigationSlice from '@/features/spaces/store/spaceNavigationSlice'
import * as slicesFeePaymentSourcePreferenceSlice from '@/features/fee-payment/store/feePaymentSourcePreferenceSlice'
import * as slicesFeatureFlagOverridesSlice from '@/features/feature-flag-overrides/store/featureFlagOverridesSlice'
import * as slicesStepUpSlice from '@/features/oidc-auth/store/stepUpSlice'
import * as slicesGateway from '@/store/api/gateway'
import * as slicesAuthSlice from '@/store/authSlice'
import * as hydrate from './useHydrateStore'
import { ofacApi } from '@/store/api/ofac'
import { safePassApi } from './api/safePass'
import { beamerApi } from './api/beamer'
import { hypernativeApi } from '@safe-global/store/hypernative/hypernativeApi'
import { safenetCheckApi } from '@safe-global/store/safenet/safenetCheckApi'
import { safenetCheckSlice } from '@safe-global/store/safenet/safenetCheckSlice'
import { version as termsVersion } from '@/markdown/terms/version'
import { cgwClient, setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import { GATEWAY_URL } from '@/config/gateway'
import { setupListeners } from '@reduxjs/toolkit/query'
import { migrateBatchTxs } from '@/services/ls-migration/batch'
import { apiSliceWithChainsConfig } from '@safe-global/store/gateway'
import { cgwErrorAlert } from './middleware/cgwErrorAlert'
import { forbiddenSessionListener } from '@/services/sessionExpiry/forbiddenSessionListener'

const rootReducer = combineReducers({
  [slicesSafeInfoSlice.safeInfoSlice.name]: slicesSafeInfoSlice.safeInfoSlice.reducer,
  [slicesSessionSlice.sessionSlice.name]: slicesSessionSlice.sessionSlice.reducer,
  [slicesTxHistorySlice.txHistorySlice.name]: slicesTxHistorySlice.txHistorySlice.reducer,
  [slicesTxQueueSlice.txQueueSlice.name]: slicesTxQueueSlice.txQueueSlice.reducer,
  [slicesSwapOrderSlice.swapOrderSlice.name]: slicesSwapOrderSlice.swapOrderSlice.reducer,
  [slicesAddressBookSlice.addressBookSlice.name]: slicesAddressBookSlice.addressBookSlice.reducer,
  [slicesNotificationsSlice.notificationsSlice.name]: slicesNotificationsSlice.notificationsSlice.reducer,
  [slicesPendingTxsSlice.pendingTxsSlice.name]: slicesPendingTxsSlice.pendingTxsSlice.reducer,
  [slicesAddedSafesSlice.addedSafesSlice.name]: slicesAddedSafesSlice.addedSafesSlice.reducer,
  [slicesSettingsSlice.settingsSlice.name]: slicesSettingsSlice.settingsSlice.reducer,
  [slicesCookiesAndTermsSlice.cookiesAndTermsSlice.name]: slicesCookiesAndTermsSlice.cookiesAndTermsSlice.reducer,
  [slicesPopupSlice.popupSlice.name]: slicesPopupSlice.popupSlice.reducer,
  [spendingLimitsSlice.spendingLimitSlice.name]: spendingLimitsSlice.spendingLimitSlice.reducer,
  [slicesSafeAppsSlice.safeAppsSlice.name]: slicesSafeAppsSlice.safeAppsSlice.reducer,
  [slicesPendingSafeMessagesSlice.pendingSafeMessagesSlice.name]:
    slicesPendingSafeMessagesSlice.pendingSafeMessagesSlice.reducer,
  [slicesBatchSlice.batchSlice.name]: slicesBatchSlice.batchSlice.reducer,
  [slicesUndeployedSafesSlice.undeployedSafesSlice.name]: slicesUndeployedSafesSlice.undeployedSafesSlice.reducer,
  [slicesPendingCfDeletesSlice.pendingCfDeletesSlice.name]: slicesPendingCfDeletesSlice.pendingCfDeletesSlice.reducer,
  [slicesSwapParamsSlice.swapParamsSlice.name]: slicesSwapParamsSlice.swapParamsSlice.reducer,
  [slicesVisitedSafesSlice.visitedSafesSlice.name]: slicesVisitedSafesSlice.visitedSafesSlice.reducer,
  [slicesOrderByPreferenceSlice.orderByPreferenceSlice.name]:
    slicesOrderByPreferenceSlice.orderByPreferenceSlice.reducer,
  [slicesHnStateSlice.hnStateSlice.name]: slicesHnStateSlice.hnStateSlice.reducer,
  [slicesHnQueueAssessmentsSlice.hnQueueAssessmentsSlice.name]:
    slicesHnQueueAssessmentsSlice.hnQueueAssessmentsSlice.reducer,
  [slicesCalendlySlice.calendlySlice.name]: slicesCalendlySlice.calendlySlice.reducer,
  [slicesGlobalSearchSlice.globalSearchSlice.name]: slicesGlobalSearchSlice.globalSearchSlice.reducer,
  [slicesSafeActionsModalSlice.safeActionsModalSlice.name]: slicesSafeActionsModalSlice.safeActionsModalSlice.reducer,
  [slicesSpaceNavigationSlice.spaceNavigationSlice.name]: slicesSpaceNavigationSlice.spaceNavigationSlice.reducer,
  [slicesFeePaymentSourcePreferenceSlice.feePaymentSourcePreferenceSlice.name]:
    slicesFeePaymentSourcePreferenceSlice.feePaymentSourcePreferenceSlice.reducer,
  [slicesFeatureFlagOverridesSlice.featureFlagOverridesSlice.name]:
    slicesFeatureFlagOverridesSlice.featureFlagOverridesSlice.reducer,
  // Deliberately absent from `persistedSlices`: a restored dialog would wait for a request that is gone.
  [slicesStepUpSlice.stepUpSlice.name]: slicesStepUpSlice.stepUpSlice.reducer,
  [ofacApi.reducerPath]: ofacApi.reducer,
  [safePassApi.reducerPath]: safePassApi.reducer,
  [beamerApi.reducerPath]: beamerApi.reducer,
  [hypernativeApi.reducerPath]: hypernativeApi.reducer,
  [safenetCheckSlice.name]: safenetCheckSlice.reducer,
  [safenetCheckApi.reducerPath]: safenetCheckApi.reducer,
  [slicesGateway.gatewayApi.reducerPath]: slicesGateway.gatewayApi.reducer,
  [cgwClient.reducerPath]: cgwClient.reducer,
  [slicesAuthSlice.authSlice.reducerPath]: slicesAuthSlice.authSlice.reducer,
})

const persistedSlices: (keyof Partial<RootState>)[] = [
  slicesSessionSlice.sessionSlice.name,
  slicesAddressBookSlice.addressBookSlice.name,
  slicesPendingTxsSlice.pendingTxsSlice.name,
  slicesAddedSafesSlice.addedSafesSlice.name,
  slicesSettingsSlice.settingsSlice.name,
  slicesCookiesAndTermsSlice.cookiesAndTermsSlice.name,
  slicesSafeAppsSlice.safeAppsSlice.name,
  slicesPendingSafeMessagesSlice.pendingSafeMessagesSlice.name,
  slicesBatchSlice.batchSlice.name,
  slicesUndeployedSafesSlice.undeployedSafesSlice.name,
  slicesPendingCfDeletesSlice.pendingCfDeletesSlice.name,
  slicesSwapParamsSlice.swapParamsSlice.name,
  slicesSwapOrderSlice.swapOrderSlice.name,
  slicesVisitedSafesSlice.visitedSafesSlice.name,
  slicesOrderByPreferenceSlice.orderByPreferenceSlice.name,
  slicesAuthSlice.authSlice.name,
  slicesHnStateSlice.hnStateSlice.name,
  slicesFeePaymentSourcePreferenceSlice.feePaymentSourcePreferenceSlice.name,
  slicesFeatureFlagOverridesSlice.featureFlagOverridesSlice.name,
]

export const getPersistedState = () => {
  return getPreloadedState(persistedSlices)
}

export const listenerMiddlewareInstance = createListenerMiddleware<RootState>()

const middleware: Middleware<{}, RootState>[] = [
  cgwErrorAlert,
  persistState(persistedSlices),
  broadcastState(persistedSlices),
  listenerMiddlewareInstance.middleware,
  ofacApi.middleware,
  safePassApi.middleware,
  beamerApi.middleware,
  hypernativeApi.middleware,
  safenetCheckApi.middleware,
  slicesGateway.gatewayApi.middleware,
]

const listeners = [
  safeMessagesListener,
  safeInfoListener,
  txHistoryListener,
  txQueueListener,
  swapOrderListener,
  swapOrderStatusListener,
  authListener,
  counterfactualSyncListener,
  addressBookListener,
  spaceSafesEntitlementsListener,
  planChangeSyncListener,
  checkoutTrackingListener,
  workspaceTrackingListener,
  spaceSafesCacheListener,
  addressBookTagsCacheListener,
  trialReminderListener,
  forbiddenSessionListener,
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

    // Migrate batchSlice txDetails to txData
    if (nextState[slicesBatchSlice.batchSlice.name]) {
      nextState[slicesBatchSlice.batchSlice.name] = migrateBatchTxs(nextState[slicesBatchSlice.batchSlice.name])
    }

    // One-time reset to the new default order (WA-2567 made "Name" / A→Z the default).
    // Guarded on the slice being present so it only touches a real store, not synthetic state.
    const orderByState = nextState[slicesOrderByPreferenceSlice.orderByPreferenceSlice.name]
    if (orderByState && orderByState.resetVersion !== slicesOrderByPreferenceSlice.ORDER_BY_RESET_VERSION) {
      nextState[slicesOrderByPreferenceSlice.orderByPreferenceSlice.name] = {
        orderBy: slicesOrderByPreferenceSlice.OrderByOption.NAME,
        resetVersion: slicesOrderByPreferenceSlice.ORDER_BY_RESET_VERSION,
        // Only the default sort direction is reset — the user's custom drag order is preserved.
        manualOrder: orderByState.manualOrder ?? {},
      }
    }

    // Mark the store as hydrated so guards wait for persisted auth state.
    // Reset cfSafeSynced so consumers wait for a fresh backend sync each page load.
    // Reset isOidcLoginPending to avoid stale state from a previous session.
    nextState.auth = {
      ...nextState.auth,
      isStoreHydrated: true,
      cfSafeSynced: false,
      isOidcLoginPending: false,
      isSessionCheckPending: false,
    }

    return nextState
  }
  return rootReducer(state, action) as RootState
}

export const makeStore = (initialState?: Partial<RootState>) => {
  setBaseUrl(GATEWAY_URL)

  const store = configureStore({
    reducer: _hydrationReducer,
    middleware: (getDefaultMiddleware) => {
      listeners.forEach((listener) => listener(listenerMiddlewareInstance))
      // Parallel Jest workers push the check past its 32 ms timing warning; the mutation check itself stays on
      const immutableCheck = APP_ENV === 'test' ? { warnAfter: 1000 } : true
      return getDefaultMiddleware({ serializableCheck: false, immutableCheck })
        .concat(cgwClient.middleware)
        .concat(middleware)
    },
    devTools: !IS_PRODUCTION,
    preloadedState: initialState,
  })

  listenToBroadcast(store)

  setupListeners(store.dispatch)

  return store
}

export type RootState = ReturnType<typeof rootReducer>
export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = AppStore['dispatch']
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action>

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export const useHydrateStore = hydrate.useHydrateStore

// Store instance for imperative usage outside of React components
// This is initialized in _app.tsx and should be used for non-component contexts
let _store: ReturnType<typeof makeStore> | null = null

export const setStoreInstance = (store: ReturnType<typeof makeStore>) => {
  _store = store
}

export const getStoreInstance = () => {
  if (!_store) {
    throw new Error('Store not initialized. Ensure _app.tsx has called setStoreInstance.')
  }
  return _store
}

/**
 * Kick off the runtime chains fetch at app root so chain config is available
 * even on routes that have no other useChains() consumer.
 */
export const useInitChains = () => {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const result = dispatch(apiSliceWithChainsConfig.endpoints.getChainsConfigV2.initiate(CONFIG_SERVICE_KEY))

    return result.unsubscribe
  }, [dispatch])
}
