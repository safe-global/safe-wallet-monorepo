import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { QueueGroupBy } from '@safe-global/views/features/spaces/components/SpaceQueue/types'
import type { RootState } from '@/store'

export const QUEUE_GROUP_BYS = ['status', 'next', 'safe', 'network'] as const satisfies readonly QueueGroupBy[]

export type SpaceQueueViewState = { groupBy: QueueGroupBy }

const initialState: SpaceQueueViewState = { groupBy: 'status' }

const isQueueGroupBy = (value: unknown): value is QueueGroupBy => QUEUE_GROUP_BYS.some((groupBy) => groupBy === value)

export const spaceQueueViewSlice = createSlice({
  name: 'spaceQueueView',
  initialState,
  reducers: {
    setQueueGroupBy: (state, { payload }: PayloadAction<QueueGroupBy>) => {
      state.groupBy = payload
    },
  },
})

export const { setQueueGroupBy } = spaceQueueViewSlice.actions

// Hydration merges localStorage in unchecked, so a value no longer offered reads as the default
export const selectQueueGroupBy = (state: RootState): QueueGroupBy => {
  const groupBy = state[spaceQueueViewSlice.name]?.groupBy
  return isQueueGroupBy(groupBy) ? groupBy : initialState.groupBy
}
