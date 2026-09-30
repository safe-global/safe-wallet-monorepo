import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AttestationVerification, CheckStatus, CheckTarget } from '@safe-global/utils/features/safenet-checks'

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
  /** Pinned verdicts keyed by {@link checkKey}. */
  pinned: Record<string, PinnedVerdict>
}

/** Identity of one check: the Safe it belongs to, plus its transaction hash. */
export type CheckIdentity = CheckTarget & { safeTxHash: string }

/**
 * The key both the session pin and the query cache entry live under. A
 * `safeTxHash` is not an identity on its own: Safe <=1.2.0 leaves the chain id
 * out of its EIP-712 domain, so one hash can name a check on two chains, and a
 * pin keyed by hash alone would show chain A's verdict for chain B's view.
 */
export const checkKey = ({ chainId, safeAddress, safeTxHash }: CheckIdentity): string =>
  `${chainId}:${safeAddress.toLowerCase()}:${safeTxHash}`

export const safenetCheckInitialState: SafenetCheckSliceState = { pinned: {} }

export const safenetCheckSlice = createSlice({
  name: 'safenetChecks',
  initialState: safenetCheckInitialState,
  reducers: {
    pinVerdict: (state, action: PayloadAction<CheckIdentity & PinnedVerdict>) => {
      const { status, atBlock, verification } = action.payload
      state.pinned[checkKey(action.payload)] = { status, atBlock, verification }
    },
  },
})

export const { pinVerdict } = safenetCheckSlice.actions

/** Minimal root-state shape a selector needs — compatible with either app store. */
export type SafenetCheckPartialState = { [safenetCheckSlice.name]: SafenetCheckSliceState }

export const selectPinnedVerdict = (
  state: SafenetCheckPartialState,
  identity: CheckIdentity,
): PinnedVerdict | undefined => state[safenetCheckSlice.name].pinned[checkKey(identity)]
