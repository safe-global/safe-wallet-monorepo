import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { cgwApi as spacesApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { cgwApi as usersApi } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { cgwApi as authApi } from '@safe-global/store/gateway/AUTO_GENERATED/auth'
import { cgwApi as billingApi } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { cgwApi as entitlementsApi } from '@safe-global/store/gateway/AUTO_GENERATED/entitlements'
import { cgwApi as counterfactualSafesApi } from '@safe-global/store/gateway/AUTO_GENERATED/counterfactual-safes'
import type { listenerMiddlewareInstance, RootState } from '@/store'
import type { OfflineWorkspace } from '../types'

type OfflineWorkspaceState = {
  isOffline: boolean
  workspaces: OfflineWorkspace[]
}

const initialState: OfflineWorkspaceState = {
  isOffline: false,
  workspaces: [],
}

export const offlineWorkspaceSlice = createSlice({
  name: 'offlineWorkspace',
  initialState,
  reducers: {
    setOfflineMode: (state, { payload }: PayloadAction<boolean>) => {
      state.isOffline = payload
    },

    upsertOfflineWorkspace: (state, { payload }: PayloadAction<OfflineWorkspace>) => {
      const index = state.workspaces.findIndex((workspace) => workspace.uuid === payload.uuid)
      if (index === -1) {
        state.workspaces.push(payload)
      } else {
        state.workspaces[index] = payload
      }
    },

    removeOfflineWorkspace: (state, { payload }: PayloadAction<string>) => {
      state.workspaces = state.workspaces.filter((workspace) => workspace.uuid !== payload)
    },
  },
})

export const { setOfflineMode, upsertOfflineWorkspace, removeOfflineWorkspace } = offlineWorkspaceSlice.actions

// Partial states built without this slice (e.g. in tests) read as online
export const selectIsOfflineWorkspace = (state: RootState): boolean => state.offlineWorkspace?.isOffline ?? false

export const selectOfflineWorkspaces = (state: RootState): OfflineWorkspace[] =>
  state.offlineWorkspace?.workspaces ?? []

// Workspace data cached in one mode must not be shown in the other
export const offlineModeListener = (listenerMiddleware: typeof listenerMiddlewareInstance) => {
  listenerMiddleware.startListening({
    actionCreator: offlineWorkspaceSlice.actions.setOfflineMode,
    effect: (_action, { dispatch }) => {
      dispatch(spacesApi.util.invalidateTags(['spaces']))
      dispatch(usersApi.util.invalidateTags(['users']))
      dispatch(authApi.util.invalidateTags(['auth']))
      dispatch(billingApi.util.invalidateTags(['billing']))
      dispatch(entitlementsApi.util.invalidateTags(['entitlements']))
      dispatch(counterfactualSafesApi.util.invalidateTags(['counterfactual-safes']))
    },
  })
}
