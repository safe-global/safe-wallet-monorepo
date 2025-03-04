// src/store/settingsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '.'

export interface SettingsState {
  onboardingVersionSeen: string
}

const initialState: SettingsState = {
  onboardingVersionSeen: '',
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
  },
})

export const selectSettings = (state: RootState, setting: keyof SettingsState) => state.settings[setting]

export const { updateSettings, resetSettings } = settingsSlice.actions
export default settingsSlice.reducer
