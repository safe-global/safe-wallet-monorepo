import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '.'

/**
 * Global settings that apply to a Safe across all chains
 */
export interface GlobalSafeSettings {
  readOnlyWarningDismissed?: boolean
  // Future global settings can be added here
}

/**
 * Per-chain settings that apply to a specific Safe on a specific chain
 */
export interface PerChainSafeSettings {
  // Future per-chain settings can be added here
  // Example: customRpcUrl?: string
}

export interface SafeSettingsData {
  global?: GlobalSafeSettings
  chains?: Record<string, PerChainSafeSettings>
}

export type SafesSettingsState = Record<string, SafeSettingsData>

const initialState: SafesSettingsState = {}

const safesSettingsSlice = createSlice({
  name: 'safesSettings',
  initialState,
  reducers: {
    // Global settings actions
    dismissReadOnlyWarning: (state, action: PayloadAction<{ safeAddress: string }>) => {
      const { safeAddress } = action.payload

      if (!state[safeAddress]) {
        state[safeAddress] = {}
      }

      const safeData = state[safeAddress]

      if (!safeData.global) {
        safeData.global = {}
      }

      safeData.global.readOnlyWarningDismissed = true
    },
    updateGlobalSettings: (
      state,
      action: PayloadAction<{ safeAddress: string; settings: Partial<GlobalSafeSettings> }>,
    ) => {
      const { safeAddress, settings } = action.payload

      if (!state[safeAddress]) {
        state[safeAddress] = {}
      }

      const safeData = state[safeAddress]
      if (!safeData) {
        return
      }

      if (!safeData.global) {
        safeData.global = {}
      }

      safeData.global = {
        ...safeData.global,
        ...settings,
      }
    },
    resetGlobalSettings: (state, action: PayloadAction<{ safeAddress: string }>) => {
      const { safeAddress } = action.payload

      if (state[safeAddress]?.global) {
        state[safeAddress].global = {}
      }
    },

    // Per-chain settings actions
    updateChainSettings: (
      state,
      action: PayloadAction<{ safeAddress: string; chainId: string; settings: Partial<PerChainSafeSettings> }>,
    ) => {
      const { safeAddress, chainId, settings } = action.payload

      if (!state[safeAddress]) {
        state[safeAddress] = {}
      }

      const safeData = state[safeAddress]
      if (!safeData) {
        return
      }

      if (!safeData.chains) {
        safeData.chains = {}
      }

      if (!safeData.chains[chainId]) {
        safeData.chains[chainId] = {}
      }

      safeData.chains[chainId] = {
        ...safeData.chains[chainId],
        ...settings,
      }
    },
    resetChainSettings: (state, action: PayloadAction<{ safeAddress: string; chainId: string }>) => {
      const { safeAddress, chainId } = action.payload

      const safeData = state[safeAddress]
      if (safeData?.chains?.[chainId]) {
        safeData.chains[chainId] = {}
      }
    },

    // Reset all settings for a safe
    resetAllSafeSettings: (state, action: PayloadAction<{ safeAddress: string }>) => {
      const { safeAddress } = action.payload

      if (state[safeAddress]) {
        state[safeAddress] = {}
      }
    },
  },
})

export const {
  dismissReadOnlyWarning,
  updateGlobalSettings,
  resetGlobalSettings,
  updateChainSettings,
  resetChainSettings,
  resetAllSafeSettings,
} = safesSettingsSlice.actions

// Selectors for global settings
export const selectGlobalSafeSettings = (state: RootState, safeAddress?: string): GlobalSafeSettings | undefined => {
  if (!safeAddress) {
    return undefined
  }
  return state.safesSettings?.[safeAddress]?.global
}

export const selectReadOnlyWarningDismissed = (state: RootState, safeAddress?: string): boolean => {
  return selectGlobalSafeSettings(state, safeAddress)?.readOnlyWarningDismissed ?? false
}

// Selectors for per-chain settings
export const selectChainSettings = (
  state: RootState,
  safeAddress?: string,
  chainId?: string,
): PerChainSafeSettings | undefined => {
  if (!safeAddress || !chainId) {
    return undefined
  }
  return state.safesSettings?.[safeAddress]?.chains?.[chainId]
}

// Selector for all settings of a safe
export const selectAllSafeSettings = (state: RootState, safeAddress?: string): SafeSettingsData | undefined => {
  if (!safeAddress) {
    return undefined
  }
  return state.safesSettings?.[safeAddress]
}

export default safesSettingsSlice.reducer
