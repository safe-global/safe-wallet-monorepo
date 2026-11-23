import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { QueueGroupBy } from '@safe-global/views/features/spaces/components/SpaceQueue/types'
import type { RootState } from '@/store'

/** Saved to localStorage (see `persistedSlices`), so keep the queue filters out of this slice */
export type SpaceQueueViewState = { groupBy: QueueGroupBy }

export const spaceQueueViewInitialState: SpaceQueueViewState = { groupBy: 'status' }

// A Record, so adding a grouping to QueueGroupBy fails to compile until it is listed here
const QUEUE_GROUP_BYS: Record<QueueGroupBy, true> = { status: true, next: true, safe: true, network: true }

const isQueueGroupBy = (value: unknown): value is QueueGroupBy =>
  typeof value === 'string' && Object.hasOwn(QUEUE_GROUP_BYS, value)

/** Falls back to the default grouping when the saved one is no longer an option */
export const migrateSpaceQueueView = (state: SpaceQueueViewState): SpaceQueueViewState =>
  isQueueGroupBy(state.groupBy) ? state : spaceQueueViewInitialState

export const spaceQueueViewSlice = createSlice({
  name: 'spaceQueueView',
  initialState: spaceQueueViewInitialState,
  reducers: {
    setQueueGroupBy: (state, { payload }: PayloadAction<QueueGroupBy>) => {
      state.groupBy = payload
    },
  },
})

export const { setQueueGroupBy } = spaceQueueViewSlice.actions

export const selectQueueGroupBy = (state: RootState): QueueGroupBy => state[spaceQueueViewSlice.name].groupBy
