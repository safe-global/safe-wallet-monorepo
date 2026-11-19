import { createSlice } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import {
  cgwApi,
  type SpaceTransactionsGetTransactionQueueV1ApiArg,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { RootState } from '@/store'

/** Shared by every view that polls the same queue, so they keep one schedule */
type QueuePolling = { failures: number; lastStartedAt: number }

const initialState: Record<string, QueuePolling> = {}

const NOT_POLLED: QueuePolling = { failures: 0, lastStartedAt: 0 }

const isServiceBusy = (error?: FetchBaseQueryError): boolean => {
  if (!error) return false
  if (typeof error.status === 'number') return error.status === 429 || error.status >= 500
  return error.status === 'FETCH_ERROR' || error.status === 'TIMEOUT_ERROR'
}

export const toSpaceQueueKey = (args: SpaceTransactionsGetTransactionQueueV1ApiArg): string => JSON.stringify(args)

export const spaceQueuePollingSlice = createSlice({
  name: 'spaceQueuePolling',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    const queueEndpoint = cgwApi?.endpoints?.spaceTransactionsGetTransactionQueueV1
    // Tests that mock the spaces module leave no endpoint to watch.
    if (!queueEndpoint) return
    builder
      .addMatcher(queueEndpoint.matchPending, (state, { meta }) => {
        const key = toSpaceQueueKey(meta.arg.originalArgs)
        state[key] = { ...(state[key] ?? NOT_POLLED), lastStartedAt: meta.startedTimeStamp }
      })
      .addMatcher(queueEndpoint.matchFulfilled, (state, { meta }) => {
        const key = toSpaceQueueKey(meta.arg.originalArgs)
        state[key] = { ...(state[key] ?? NOT_POLLED), failures: 0 }
      })
      .addMatcher(queueEndpoint.matchRejected, (state, { meta, payload }) => {
        if (meta.condition || meta.aborted || !isServiceBusy(payload)) return
        const key = toSpaceQueueKey(meta.arg.originalArgs)
        const polling = state[key] ?? NOT_POLLED
        state[key] = { ...polling, failures: polling.failures + 1 }
      })
  },
})

export const selectSpaceQueuePolling = (state: RootState, queueKey: string): QueuePolling =>
  state[spaceQueuePollingSlice.name][queueKey] ?? NOT_POLLED
