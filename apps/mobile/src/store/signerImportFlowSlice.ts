import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '.'

interface PendingSafe {
  address: string
  name: string
}

interface SignerImportFlowState {
  pendingSafe: PendingSafe | null
}

const initialState: SignerImportFlowState = {
  pendingSafe: null,
}

const signerImportFlowSlice = createSlice({
  name: 'signerImportFlow',
  initialState,
  reducers: {
    setPendingSafe: (state, action: PayloadAction<PendingSafe>) => {
      state.pendingSafe = action.payload
    },
    clearPendingSafe: (state) => {
      state.pendingSafe = null
    },
  },
})

export const { setPendingSafe, clearPendingSafe } = signerImportFlowSlice.actions

export const selectPendingSafe = (state: RootState) => state.signerImportFlow.pendingSafe

export default signerImportFlowSlice.reducer
