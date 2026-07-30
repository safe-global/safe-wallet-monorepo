import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import type { PendingPolicy, PolicyInfo } from '@safe-global/store/gateway/policies/types'
import { computeConfigureRoot, type PolicyConfiguration } from './guardTx'

/**
 * Rebuild the on-chain `Configuration[]` from CGW's bindings.
 *
 * Order is preserved deliberately: the array order is part of the hash, and CGW
 * returns entries in submitted order. Sorting the list before rebuilding would
 * change the root and make `applyConfiguration` revert.
 */
export const toConfigurations = (policies: readonly PolicyInfo[]): PolicyConfiguration[] =>
  policies.map((policy) => ({
    target: policy.target,
    selector: policy.selector,
    operation: policy.operation === 'DELEGATECALL' ? 1 : 0,
    policy: policy.policyContract ?? ZERO_ADDRESS,
    data: policy.data ?? '0x',
  }))

const isHex = (value: unknown): value is string => typeof value === 'string' && /^0x[0-9a-fA-F]*$/.test(value)

/**
 * Whether bindings carry everything needed to rebuild the request.
 *
 * A CGW that doesn't serve `data` yet still returns bindings — enough to describe the
 * request, not enough to reproduce its root. Defaulting a missing payload to `0x` would
 * hash to something else and the apply would revert, so treat it as unusable instead.
 */
export const isRebuildable = (policies: readonly PolicyInfo[]): boolean =>
  policies.every((policy) => isHex(policy.data) && isHex(policy.target) && isHex(policy.selector))

const sameHex = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

/**
 * Whether these configurations are the ones the root committed to.
 *
 * Returns false rather than throwing on a payload the ABI coder rejects: this runs
 * during render, and a malformed row must disable its button, not break the list.
 */
export const matchesRoot = (configurations: PolicyConfiguration[], root: string): boolean => {
  try {
    return sameHex(computeConfigureRoot(configurations), root)
  } catch {
    return false
  }
}

export type ApplyBlockedReason =
  /** The guard's delay hasn't elapsed. */
  | 'not-ready'
  /** Neither CGW nor this browser holds the payload behind the root. */
  | 'no-configurations'
  /** CGW describes the request but omits the payload, so it can't be rebuilt. */
  | 'incomplete-configurations'
  /** Rebuilt configurations don't hash to the root — the tx would revert. */
  | 'root-mismatch'
  /** No guard address to send the transaction to. */
  | 'no-guard'

export type ApplyPlan =
  | {
      canApply: true
      guard: string
      configurations: PolicyConfiguration[]
      /** Where the payload came from — CGW works for any signer, local only for the requester. */
      source: 'cgw' | 'local'
    }
  | { canApply: false; reason: ApplyBlockedReason }

type LocalSnapshot = {
  configurations: PolicyConfiguration[]
  /** The guard the request was made against, when known locally. */
  guard?: string
}

export type ResolveApplyPlanInput = {
  pending: PendingPolicy
  /** The requester's stored snapshot, when this browser made the request. */
  local?: LocalSnapshot
  /** Unix seconds; lets the clock catch up between CGW polls. */
  nowSec: number
}

/**
 * Decides whether `applyConfiguration` can be offered for a pending request, and
 * with what payload.
 *
 * CGW's bindings are preferred over the local snapshot: the signer who applies is
 * usually not the one who requested — different device, days later — which is the
 * whole reason CGW stores the payload. The local snapshot stays as a fallback for a
 * CGW that doesn't serve the bindings yet.
 *
 * Both sources are re-hashed against `configureRoot` before being offered. A
 * mismatch means the encodings disagree or the row belongs to a different root; the
 * transaction would revert on-chain, so the action is withheld rather than attempted.
 */
export const resolveApplyPlan = ({ pending, local, nowSec }: ResolveApplyPlanInput): ApplyPlan => {
  if (!pending.isReady && nowSec < pending.readyAt) {
    return { canApply: false, reason: 'not-ready' }
  }

  const bindings = pending.policies?.length ? pending.policies : undefined
  const fromCgw = bindings && isRebuildable(bindings) ? toConfigurations(bindings) : undefined
  const configurations = fromCgw ?? (local?.configurations.length ? local.configurations : undefined)

  if (!configurations) {
    // Distinguish "CGW knows nothing" from "CGW knows, but not the payload" — only the
    // latter is fixed by CGW serving `data`.
    return { canApply: false, reason: bindings ? 'incomplete-configurations' : 'no-configurations' }
  }

  if (!matchesRoot(configurations, pending.configureRoot)) {
    return { canApply: false, reason: 'root-mismatch' }
  }

  const guard = pending.safePolicyGuard ?? local?.guard

  if (!guard) {
    return { canApply: false, reason: 'no-guard' }
  }

  return { canApply: true, guard, configurations, source: fromCgw ? 'cgw' : 'local' }
}

/** What to tell the user when Apply is unavailable. Empty when it is available. */
export const APPLY_BLOCKED_MESSAGE: Record<ApplyBlockedReason, string> = {
  'not-ready': '',
  'no-configurations': "The original policy payload isn't available, so this request can't be applied.",
  'incomplete-configurations': "This request's details are incomplete, so it can't be applied yet.",
  'root-mismatch': "This request's details don't match what was requested on-chain, so it can't be applied.",
  'no-guard': "The policy guard for this request isn't known, so it can't be applied.",
}
