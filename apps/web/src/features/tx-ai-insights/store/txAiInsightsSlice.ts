import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import type { TxAiInsight } from '../types'

export const buildKey = (chainId: string, safeTxHash: string) => `${chainId}:${safeTxHash}`

export type TxAiInsightsState = {
  [key: string]: TxAiInsight
}

const initialState: TxAiInsightsState = {}

export const txAiInsightsSlice = createSlice({
  name: 'txAiInsights',
  initialState,
  reducers: {
    setTxAiInsight: (state, action: PayloadAction<{ chainId: string; insight: TxAiInsight }>) => {
      const { chainId, insight } = action.payload
      state[buildKey(chainId, insight.safeTxHash)] = insight
    },
  },
})

export const { setTxAiInsight } = txAiInsightsSlice.actions

export const selectTxAiInsight = (
  state: RootState,
  chainId: string,
  safeTxHash: string | undefined,
): TxAiInsight | undefined => {
  if (!safeTxHash) return undefined
  return state[txAiInsightsSlice.name]?.[buildKey(chainId, safeTxHash)]
}
