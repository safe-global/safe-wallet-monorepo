import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AttestationVerification, CheckStatus } from '@safe-global/utils/features/safenet-checks'

/**
 * A verdict pinned for the current session. The pin is the monotonic floor the
 * query layer merges against so a poll (or a chain reorg) can never visibly walk
 * a check's status backwards. Session-only — never persisted (see the mobile
 * `persistBlacklist` and the web store leaving it out of `persistedSlices`).
 */
export type PinnedVerdict = {
  status: CheckStatus
  /** Chain head at which this verdict was pinned (decimal string), or null. */
  atBlock: string | null
  verification: AttestationVerification
}

export type SafenetCheckSliceState = {
  /** Pinned verdicts keyed by `safeTxHash`. */
  pinned: Record<string, PinnedVerdict>
}

export const safenetCheckInitialState: SafenetCheckSliceState = { pinned: {} }

export const safenetCheckSlice = createSlice({
  name: 'safenetChecks',
  initialState: safenetCheckInitialState,
  reducers: {
    pinVerdict: (state, action: PayloadAction<{ safeTxHash: string } & PinnedVerdict>) => {
      const { safeTxHash, status, atBlock, verification } = action.payload
      state.pinned[safeTxHash] = { status, atBlock, verification }
    },
  },
})

export const { pinVerdict } = safenetCheckSlice.actions

/** Minimal root-state shape a selector needs — compatible with either app store. */
export type SafenetCheckPartialState = { [safenetCheckSlice.name]: SafenetCheckSliceState }

export const selectPinnedVerdict = (state: SafenetCheckPartialState, safeTxHash: string): PinnedVerdict | undefined =>
  state[safenetCheckSlice.name].pinned[safeTxHash]
