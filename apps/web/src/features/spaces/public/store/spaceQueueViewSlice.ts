import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { QueueGroupBy } from '@safe-global/views/features/spaces/components/SpaceQueue/types'
import type { RootState } from '@/store'

export type SpaceQueueViewState = { groupBy: QueueGroupBy }

const initialState: SpaceQueueViewState = { groupBy: 'status' }

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

export const selectQueueGroupBy = (state: RootState): QueueGroupBy => state[spaceQueueViewSlice.name].groupBy
