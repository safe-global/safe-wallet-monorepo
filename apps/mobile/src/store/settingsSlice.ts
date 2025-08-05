import { ThemePreference } from '@/src/types/theme'
import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '.'
import merge from 'lodash/merge'

import type { EnvState } from '@safe-global/store/settingsSlice'

export interface SettingsState {
  onboardingVersionSeen: string
  themePreference: ThemePreference
  currency: string
  env: EnvState
}

const initialState: SettingsState = {
  onboardingVersionSeen: '',
  themePreference: 'auto' as ThemePreference,
  currency: 'usd',
  env: {
    rpc: {},
    tenderly: {
      url: '',
      accessToken: '',
    },
  },
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateSettings(state, action: PayloadAction<Partial<SettingsState>>) {
      return { ...state, ...action.payload }
    },
    resetSettings() {
      return initialState
    },
    setCurrency: (state, { payload }: PayloadAction<SettingsState['currency']>) => {
      state.currency = payload
    },
    setRpc: (state, { payload }: PayloadAction<{ chainId: string; rpc: string }>) => {
      const { chainId, rpc } = payload
      if (rpc) {
        state.env.rpc[chainId] = rpc
      } else {
        const { [chainId]: _, ...rest } = state.env.rpc
        state.env.rpc = rest
      }
    },
    setTenderly: (state, { payload }: PayloadAction<EnvState['tenderly']>) => {
      state.env.tenderly = merge({}, state.env.tenderly, payload)
    },
  },
})

export const selectSettings = (state: RootState, setting: keyof SettingsState) => state.settings[setting]

export const selectSettingsState = (state: RootState) => state.settings

export const selectCurrency = createSelector(
  selectSettingsState,
  (settings) => settings.currency || initialState.currency,
)

export const selectRpc = createSelector(selectSettingsState, (settings) => {
  return settings?.env?.rpc
})

export const selectTenderly = createSelector(selectSettingsState, (settings) => settings?.env?.tenderly)

export const { updateSettings, resetSettings, setCurrency } = settingsSlice.actions
export default settingsSlice.reducer
