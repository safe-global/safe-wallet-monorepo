import { isRejectedWithValue, type UnknownAction } from '@reduxjs/toolkit'
import type { SafesGetSafeV1ApiArg } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { cgwClient } from '@safe-global/store/gateway/cgwClient'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import { getHttpStatusFromError } from '@safe-global/utils/services/exceptions/utils'
import type { listenerMiddlewareInstance } from '@/store'
import { Errors, logError } from '@/services/exceptions'
import { isAuthenticated, selectCfSafeSynced, selectIsStoreHydrated } from './authSlice'
import { makeLoadableSlice } from './common'

const { slice, selector } = makeLoadableSlice('safeInfo', undefined as ExtendedSafeInfo | undefined)

export const safeInfoSlice = slice
export const selectSafeInfo = selector

type SafeInfoRejected = UnknownAction & { payload: unknown; meta: { arg: { originalArgs: SafesGetSafeV1ApiArg } } }

const isSafeInfoRejected = (action: UnknownAction): action is SafeInfoRejected =>
  isRejectedWithValue(action) &&
  action.type.startsWith(`${cgwClient.reducerPath}/`) &&
  (action.meta.arg as { endpointName?: string } | undefined)?.endpointName === 'safesGetSafeV1'

export const safeInfoListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({
    predicate: isSafeInfoRejected,
    effect: (action, listenerApi) => {
      const state = listenerApi.getState()
      const { chainId, safeAddress } = action.meta.arg.originalArgs

      // A counterfactual Safe is not known to CGW yet, so its 404 is the expected answer.
      if (state.undeployedSafes?.[chainId]?.[safeAddress]) return

      // Until the counterfactual sync settles, a 404 may still turn out to be a counterfactual Safe.
      const awaitingCfSync = !selectIsStoreHydrated(state) || (isAuthenticated(state) && !selectCfSafeSynced(state))
      if (awaitingCfSync && getHttpStatusFromError(action.payload) === 404) return

      logError(Errors._600, action.payload)
    },
  })
}
