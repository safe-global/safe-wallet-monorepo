import { createSlice, PayloadAction, Slice } from '@reduxjs/toolkit'
import { RootState } from '.'
import { FETCH_STATUS, TenderlySimulation } from '@safe-global/utils/components/tx/security/tenderly/types'

type simulationState = {
  status: FETCH_STATUS
  link?: string
  error?: string
  dataStatus: boolean
  callTrace: TenderlySimulation['transaction']['call_trace']
}

export type txSimulationState = Record<string, simulationState>

const settingsSlice: Slice<txSimulationState> = createSlice({
  name: 'txSimulation',
  initialState: {},
  reducers: {
    setTxSimulation: (
      state,
      action: PayloadAction<
        {
          txId: string
        } & simulationState
      >,
    ) => {
      const { txId, status, link, error, dataStatus, callTrace } = action.payload
      state[txId] = { status, link, error, dataStatus, callTrace }
    },
  },
})

export const selectCachedSimulation = (state: RootState, txId?: string) => (txId ? state.txSimulation[txId] : undefined)

export const { setTxSimulation } = settingsSlice.actions
export default settingsSlice.reducer
