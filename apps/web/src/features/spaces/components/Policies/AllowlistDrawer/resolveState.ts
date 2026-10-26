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
  CANCEL_CONNECT_HELPER,
  CANCEL_NOT_A_SIGNER_HELPER,
  NOT_A_SIGNER_HELPER,
  OUTCOME_TITLE,
  PENDING_BANNER_TITLE,
  SCHEDULED_BANNER_LINE,
  SCHEDULED_BANNER_TITLE,
  outcomeLine,
  type AllowlistTxOutcome,
} from '@safe-global/views/features/spaces/components/Policies/AllowlistDrawer/messages'

/** Executed, waiting out the guard's delay. Only a change to a live allowlist can be cancelled. */
export type ScheduledDrawerState = {
  kind: 'scheduled'
  operation: AllowlistScheduledChange['operation']
  action: 'cancel' | 'connect' | 'none'
  disabled: boolean
  bannerTitle: string
  bannerLine2: string
  helper?: string
}

export type AllowlistDrawerState = ActiveDrawerState | PendingDrawerState | ClosedDrawerState | ScheduledDrawerState

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
  if (!viewer.isSigner) return { kind: 'active', action: 'manage', disabled: true, helper: NOT_A_SIGNER_HELPER }

  return { kind: 'active', action: 'manage', disabled: false }
}

const resolveScheduled = ({ operation }: AllowlistScheduledChange, viewer: Viewer): ScheduledDrawerState => {
  const base = {
    kind: 'scheduled',
    operation,
    bannerTitle: SCHEDULED_BANNER_TITLE,
    bannerLine2: SCHEDULED_BANNER_LINE[operation],
  } as const

  if (operation === 'create') return { ...base, action: 'none', disabled: false }
  if (!viewer.address) return { ...base, action: 'connect', disabled: false, helper: CANCEL_CONNECT_HELPER }
  if (!viewer.isSigner) return { ...base, action: 'cancel', disabled: true, helper: CANCEL_NOT_A_SIGNER_HELPER }

  return { ...base, action: 'cancel', disabled: false }
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

const resolveClosed = (policy: PendingAllowlistPolicy, outcome: AllowlistTxOutcome): ClosedDrawerState => ({
  kind: 'closed',
  operation: policy.operation,
  action: 'none',
  bannerTitle: OUTCOME_TITLE[outcome],
  bannerLine2: outcomeLine(outcome, policy.operation),
})

export const resolveAllowlistDrawerState = (
  policy: AllowlistDrawerPolicy,
  viewer: Viewer,
  safeName: string,
  outcome: AllowlistTxOutcome | undefined = inferAllowlistOutcome(policy, Date.now()),
): AllowlistDrawerState => {
  if (policy.status === 'failed') return resolveClosed(policy, outcome ?? 'failed')
  if (policy.status === 'pending') {
    return outcome ? resolveClosed(policy, outcome) : resolvePending(policy, viewer, safeName)
  }

  return policy.scheduledChange ? resolveScheduled(policy.scheduledChange, viewer) : resolveActive(viewer)
}
