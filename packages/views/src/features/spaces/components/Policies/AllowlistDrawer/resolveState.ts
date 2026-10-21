import type { AllowlistPolicy, QueuedAllowlistPolicy } from '../types'
import type {
  ActiveDrawerState,
  ClosedDrawerState,
  PendingDrawerState,
  PendingTxOutcome,
  Viewer,
} from '../SpendingLimitDrawer/resolveState'
import {
  ACTIVE_CONNECT_HELPER,
  CONNECT_TO_SIGN_LINE,
  PENDING_OUTCOME_TITLE,
  connectHelper,
  executeLine,
  signedAndWaitingLine,
  signAndExecuteLine,
} from '../SpendingLimitDrawer/messages'
import { NOT_A_SIGNER_HELPER, PENDING_BANNER_TITLE, outcomeLine } from './messages'

export type AllowlistDrawerState = ActiveDrawerState | PendingDrawerState | ClosedDrawerState

export type ActiveAllowlistPolicy = AllowlistPolicy & { status: 'active' }

export type AllowlistDrawerPolicy = ActiveAllowlistPolicy | QueuedAllowlistPolicy

const resolveActive = (viewer: Viewer): ActiveDrawerState => {
  if (!viewer.address) return { kind: 'active', action: 'connect', disabled: false, helper: ACTIVE_CONNECT_HELPER }
  if (!viewer.isSigner) return { kind: 'active', action: 'manage', disabled: true, helper: NOT_A_SIGNER_HELPER }

  return { kind: 'active', action: 'manage', disabled: false }
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

const resolveClosed = (policy: QueuedAllowlistPolicy, outcome: PendingTxOutcome): ClosedDrawerState => ({
  kind: 'closed',
  operation: policy.operation,
  action: 'none',
  bannerTitle: PENDING_OUTCOME_TITLE[outcome],
  bannerLine2: outcomeLine(outcome, policy.operation),
})

export const resolveAllowlistDrawerState = (
  policy: AllowlistDrawerPolicy,
  viewer: Viewer,
  safeName: string,
  outcome?: PendingTxOutcome,
): AllowlistDrawerState => {
  if (policy.status === 'pending') {
    return outcome ? resolveClosed(policy, outcome) : resolvePending(policy, viewer, safeName)
  }

  return resolveActive(viewer)
}
