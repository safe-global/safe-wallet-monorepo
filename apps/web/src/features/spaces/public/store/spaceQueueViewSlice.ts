import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { QueueGroupBy } from '@safe-global/views/features/spaces/components/SpaceQueue/types'
import type { RootState } from '@/store'

/**
 * Saved to localStorage (see `persistedSlices`), so keep the queue filters out of this slice.
 * `collapseAll` is the last Collapse all / Expand all pick; collapsing a single group is not saved.
 */
export type SpaceQueueViewState = { groupBy: QueueGroupBy; collapseAll: boolean }

export const spaceQueueViewInitialState: SpaceQueueViewState = { groupBy: 'status', collapseAll: false }

// A Record, so adding a grouping to QueueGroupBy fails to compile until it is listed here
const QUEUE_GROUP_BYS: Record<QueueGroupBy, true> = { status: true, next: true, safe: true, network: true }

const isQueueGroupBy = (value: unknown): value is QueueGroupBy =>
  typeof value === 'string' && Object.hasOwn(QUEUE_GROUP_BYS, value)

/** Checks each saved field on its own, so a bad one falls back to its default without resetting the others */
export const migrateSpaceQueueView = (state: unknown): SpaceQueueViewState => {
  const saved: Partial<Record<keyof SpaceQueueViewState, unknown>> =
    typeof state === 'object' && state !== null ? state : {}
  return {
    groupBy: isQueueGroupBy(saved.groupBy) ? saved.groupBy : spaceQueueViewInitialState.groupBy,
    collapseAll: typeof saved.collapseAll === 'boolean' ? saved.collapseAll : spaceQueueViewInitialState.collapseAll,
  }
}

export const spaceQueueViewSlice = createSlice({
  name: 'spaceQueueView',
  initialState: spaceQueueViewInitialState,
  reducers: {
    setQueueGroupBy: (state, { payload }: PayloadAction<QueueGroupBy>) => {
      state.groupBy = payload
    },
    setQueueCollapseAll: (state, { payload }: PayloadAction<boolean>) => {
      state.collapseAll = payload
    },
  },
})

export const { setQueueGroupBy, setQueueCollapseAll } = spaceQueueViewSlice.actions

export const selectQueueGroupBy = (state: RootState): QueueGroupBy => state[spaceQueueViewSlice.name].groupBy

export const selectQueueCollapseAll = (state: RootState): boolean => state[spaceQueueViewSlice.name].collapseAll
