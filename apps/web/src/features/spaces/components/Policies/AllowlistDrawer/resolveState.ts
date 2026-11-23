import type {
  AllowlistPolicy,
  AllowlistScheduledChange,
  FailedAllowlistPolicy,
  PendingAllowlistPolicy,
  QueuedAllowlistPolicy,
} from '@safe-global/views/features/spaces/components/Policies/types'
import type {
  ActiveDrawerState,
  ClosedDrawerState,
  PendingDrawerState,
  Viewer,
} from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/resolveState'
import {
  ACTIVE_CONNECT_HELPER,
  CONNECT_TO_SIGN_LINE,
  connectHelper,
  executeLine,
  signedAndWaitingLine,
  signAndExecuteLine,
} from '@safe-global/views/features/spaces/components/Policies/SpendingLimitDrawer/messages'
import {
  APPLIED_ON_EXECUTION_LINE,
  NOT_A_SIGNER_EDIT_HELPER,
  OUTCOME_TITLE,
  PENDING_BANNER_TITLE,
  APPLY_CONNECT_HELPER,
  APPLY_NOT_A_SIGNER_HELPER,
  APPLY_SIGNER_HELPER,
  EXPIRED_HELPER,
  GUARD_REMOVAL_BANNER_LINE,
  GUARD_REMOVAL_BANNER_TITLE,
  REMOVE_GUARD_CONNECT_HELPER,
  REMOVE_GUARD_NOT_A_SIGNER_HELPER,
  UNENFORCED_BANNER_LINE,
  UNENFORCED_BANNER_TITLE,
  outcomeLine,
  type AllowlistTxOutcome,
} from '@safe-global/views/features/spaces/components/Policies/AllowlistDrawer/messages'
import { POLICY_CHANGE_DELAY } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/constants'

/** The request executed and waits out the guard's delay: the apply button stays disabled until then. */
export type ScheduledDrawerState = {
  kind: 'scheduled'
  operation: AllowlistScheduledChange['operation']
  action: 'apply-later'
  disabled: true
}

/** The delay is over: `applyConfiguration` can be proposed until the apply window closes. */
export type ReadyToApplyDrawerState = {
  kind: 'ready-to-apply'
  operation: AllowlistScheduledChange['operation']
  action: 'apply' | 'connect'
  disabled: boolean
  helper: string
}

/** The apply window closed: the requested root can no longer be applied, only discarded. */
export type ExpiredRequestDrawerState = {
  kind: 'expired-request'
  operation: AllowlistScheduledChange['operation']
  action: 'discard'
  helper: string
}

/** An applied removal left no rule: the guard only lets the transaction through that takes it off. */
export type RemoveGuardDrawerState = {
  kind: 'remove-guard'
  action: 'remove-guard' | 'connect'
  disabled: boolean
  helper: string
  bannerTitle: string
  bannerLine2: string
}

/** The guard is not in both slots. No flow can put it back yet, so there is nothing to offer. */
// TODO(WA-3964): add a partly enforced state, with its own copy and a "Turn on guard" action.
export type UnenforcedAllowlistDrawerState = {
  kind: 'unenforced'
  action: 'none'
  bannerTitle: string
  bannerLine2: string
}

export type AllowlistDrawerState =
  | ActiveDrawerState
  | PendingDrawerState
  | ClosedDrawerState
  | ScheduledDrawerState
  | ReadyToApplyDrawerState
  | ExpiredRequestDrawerState
  | RemoveGuardDrawerState
  | UnenforcedAllowlistDrawerState

export type ActiveAllowlistPolicy = AllowlistPolicy & { status: 'active' }

export type AllowlistDrawerPolicy = ActiveAllowlistPolicy | QueuedAllowlistPolicy | FailedAllowlistPolicy

/** The outcome a row carries on its own: a failed status, or a pending one whose signing window has closed. */
export const inferAllowlistOutcome = (policy: AllowlistDrawerPolicy, nowMs: number): AllowlistTxOutcome | undefined => {
  if (policy.status === 'failed') return 'failed'
  if (policy.status === 'pending' && policy.expiresAt !== undefined && policy.expiresAt * 1_000 <= nowMs) {
    return 'expired'
  }

  return undefined
}

const resolveActive = (viewer: Viewer): ActiveDrawerState => {
  if (!viewer.address) return { kind: 'active', action: 'connect', disabled: false, helper: ACTIVE_CONNECT_HELPER }
  if (!viewer.isSigner) return { kind: 'active', action: 'manage', disabled: true, helper: NOT_A_SIGNER_EDIT_HELPER }

  return { kind: 'active', action: 'manage', disabled: false }
}

const UNENFORCED_STATE: UnenforcedAllowlistDrawerState = {
  kind: 'unenforced',
  action: 'none',
  bannerTitle: UNENFORCED_BANNER_TITLE,
  bannerLine2: UNENFORCED_BANNER_LINE,
}

const resolveRemoveGuard = (viewer: Viewer): RemoveGuardDrawerState => {
  const base = {
    kind: 'remove-guard',
    bannerTitle: GUARD_REMOVAL_BANNER_TITLE,
    bannerLine2: GUARD_REMOVAL_BANNER_LINE,
  } as const

  if (!viewer.address) return { ...base, action: 'connect', disabled: false, helper: REMOVE_GUARD_CONNECT_HELPER }
  if (!viewer.isSigner) {
    return { ...base, action: 'remove-guard', disabled: true, helper: REMOVE_GUARD_NOT_A_SIGNER_HELPER }
  }

  return { ...base, action: 'remove-guard', disabled: false, helper: APPLY_SIGNER_HELPER }
}

const resolveReadyToApply = (
  operation: AllowlistScheduledChange['operation'],
  viewer: Viewer,
): ReadyToApplyDrawerState => {
  const base = { kind: 'ready-to-apply', operation } as const

  if (!viewer.address) return { ...base, action: 'connect', disabled: false, helper: APPLY_CONNECT_HELPER }
  if (!viewer.isSigner) return { ...base, action: 'apply', disabled: true, helper: APPLY_NOT_A_SIGNER_HELPER }

  return { ...base, action: 'apply', disabled: false, helper: APPLY_SIGNER_HELPER }
}

const resolveScheduled = (
  { operation, appliesAt, expiresAt }: AllowlistScheduledChange,
  viewer: Viewer,
  nowMs: number,
): ScheduledDrawerState | ReadyToApplyDrawerState | ExpiredRequestDrawerState => {
  if (expiresAt !== undefined && expiresAt * 1_000 <= nowMs) {
    return { kind: 'expired-request', operation, action: 'discard', helper: EXPIRED_HELPER[operation] }
  }
  if (appliesAt * 1_000 <= nowMs) return resolveReadyToApply(operation, viewer)

  return { kind: 'scheduled', operation, action: 'apply-later', disabled: true }
}

const resolvePending = (policy: QueuedAllowlistPolicy, viewer: Viewer, safeName: string): PendingDrawerState => {
  const base = {
    kind: 'pending',
    operation: policy.operation,
    bannerTitle: PENDING_BANNER_TITLE[policy.operation],
    signed: policy.confirmationsSubmitted,
    required: policy.confirmationsRequired,
  } as const

  if (!viewer.address) {
    return { ...base, action: 'connect', bannerLine2: CONNECT_TO_SIGN_LINE, helper: connectHelper(safeName) }
  }

  // Anyone can execute a fully signed Safe transaction, so this outranks the signer checks below.
  if (policy.confirmationsSubmitted >= policy.confirmationsRequired) {
    return { ...base, action: 'review', bannerLine2: executeLine(policy.operation) }
  }

  if (!viewer.isSigner) return { ...base, action: 'copy-link' }

  if (viewer.hasSigned === undefined) return { ...base, action: 'review' }

  if (viewer.hasSigned) {
    const missing = policy.confirmationsRequired - policy.confirmationsSubmitted

    return { ...base, action: 'copy-link', bannerLine2: signedAndWaitingLine(missing) }
  }

  return { ...base, action: 'review', bannerLine2: signAndExecuteLine(policy.operation) }
}

const resolveClosed = (
  policy: PendingAllowlistPolicy,
  outcome: AllowlistTxOutcome,
  changeDelay: string,
): ClosedDrawerState => ({
  kind: 'closed',
  operation: policy.operation,
  action: 'none',
  bannerTitle: OUTCOME_TITLE[outcome],
  bannerLine2:
    outcome === 'executed' && policy.appliesOnExecution
      ? APPLIED_ON_EXECUTION_LINE
      : outcomeLine(outcome, policy.operation, changeDelay),
})

export const resolveAllowlistDrawerState = (
  policy: AllowlistDrawerPolicy,
  viewer: Viewer,
  safeName: string,
  outcome: AllowlistTxOutcome | undefined = inferAllowlistOutcome(policy, Date.now()),
  nowMs: number = Date.now(),
  changeDelay: string = POLICY_CHANGE_DELAY,
): AllowlistDrawerState => {
  if (policy.status === 'failed') return resolveClosed(policy, outcome ?? 'failed', changeDelay)
  if (policy.status === 'pending') {
    return outcome ? resolveClosed(policy, outcome, changeDelay) : resolvePending(policy, viewer, safeName)
  }

  if (policy.awaitingGuardRemoval) return resolveRemoveGuard(viewer)
  if (policy.scheduledChange) return resolveScheduled(policy.scheduledChange, viewer, nowMs)

  return policy.enabled ? resolveActive(viewer) : UNENFORCED_STATE
}
