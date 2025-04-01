import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '.'

interface BiometricsState {
  isEnabled: boolean
  type: 'FACE_ID' | 'TOUCH_ID' | 'FINGERPRINT' | 'NONE'
  isSupported: boolean
}

const initialState: BiometricsState = {
  isEnabled: false,
  type: 'NONE',
  isSupported: false,
}

const biometricsSlice = createSlice({
  name: 'biometrics',
  initialState,
  reducers: {
    setBiometricsEnabled: (state, action: PayloadAction<boolean>) => {
      state.isEnabled = action.payload
    },
    setBiometricsType: (state, action: PayloadAction<BiometricsState['type']>) => {
      state.type = action.payload
    },
    setBiometricsSupported: (state, action: PayloadAction<boolean>) => {
      state.isSupported = action.payload
    },
  },
})

export const { setBiometricsEnabled, setBiometricsType, setBiometricsSupported } = biometricsSlice.actions

export const selectBiometricsEnabled = (state: RootState) => state.biometrics.isEnabled
export const selectBiometricsType = (state: RootState) => state.biometrics.type
export const selectBiometricsSupported = (state: RootState) => state.biometrics.isSupported

export default biometricsSlice.reducer
