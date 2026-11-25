import type {
  AllowlistScheduledChange,
  PendingAllowlistPolicy,
  Policy,
} from '@safe-global/views/features/spaces/components/Policies/types'
import {
  ALLOWLIST_STATUS,
  AWAITING_EXECUTION_TOOLTIP,
  EXPIRED_TOOLTIP,
  FAILED_TOOLTIP,
  GUARD_REMOVAL_TOOLTIP,
  PROCESSING_TOOLTIP,
  awaitingSignaturesTooltip,
  executeByTooltip,
  formatAllowlistStatus,
  inDelayTooltip,
  readyToApplyTooltip,
  type AllowlistChange,
  type AllowlistSignatures,
  type AllowlistState,
  type AllowlistStatusBadge,
} from '@safe-global/views/features/spaces/components/Policies/allowlistStatus'

export type AllowlistRow = Extract<Policy, { type: 'allowlist' }>

type ChangeStates = Record<
  'pending' | 'readyToExecute' | 'inDelay' | 'readyToApply' | 'applyPending' | 'applyReadyToExecute' | 'expired',
  AllowlistState
>

// A first allowlist requested on a guard that is already on is a change to its rules, like an edit.
const CHANGE_STATES: Record<'edit' | 'removal', ChangeStates> = {
  edit: {
    pending: 'edit-pending',
    readyToExecute: 'edit-ready-to-execute',
    inDelay: 'edit-in-delay',
    readyToApply: 'edit-ready-to-apply',
    applyPending: 'edit-apply-pending',
    applyReadyToExecute: 'edit-apply-ready-to-execute',
    expired: 'edit-expired',
  },
  removal: {
    pending: 'removal-pending',
    readyToExecute: 'removal-ready-to-execute',
    inDelay: 'removal-in-delay',
    readyToApply: 'removal-ready-to-apply',
    applyPending: 'removal-apply-pending',
    applyReadyToExecute: 'removal-apply-ready-to-execute',
    expired: 'removal-expired',
  },
}

const delayedChangeOf = (operation: PendingAllowlistPolicy['operation']): 'edit' | 'removal' =>
  operation === 'remove' ? 'removal' : 'edit'

const changeStatesOf = (operation: PendingAllowlistPolicy['operation']): ChangeStates =>
  CHANGE_STATES[delayedChangeOf(operation)]

const isFullySigned = (policy: PendingAllowlistPolicy): boolean =>
  policy.confirmationsSubmitted >= policy.confirmationsRequired

const resolveQueued = (policy: PendingAllowlistPolicy): AllowlistState => {
  const isSigned = isFullySigned(policy)
  if (policy.appliesOnExecution) return isSigned ? 'setup-ready-to-execute' : 'setup-pending'
  if (policy.step === 'remove-guard') return isSigned ? 'guard-removal-ready-to-execute' : 'guard-removal-pending'

  const states = changeStatesOf(policy.operation)
  if (policy.step === 'apply') return isSigned ? states.applyReadyToExecute : states.applyPending

  return isSigned ? states.readyToExecute : states.pending
}

const resolveScheduled = ({ operation, appliesAt, expiresAt }: AllowlistScheduledChange, nowMs: number) => {
  const states = changeStatesOf(operation)
  if (expiresAt !== undefined && expiresAt * 1_000 <= nowMs) return states.expired

  return appliesAt * 1_000 <= nowMs ? states.readyToApply : states.inDelay
}

/** Which state the allowlist is in, as far as its row tells. */
export const resolveAllowlistState = (policy: AllowlistRow, nowMs: number): AllowlistState => {
  if (policy.status === 'activating') return 'processing'
  if (policy.status === 'failed') return 'failed'
  if (policy.status !== 'active') return resolveQueued(policy)
  if (policy.awaitingGuardRemoval) return 'guard-removal-pending'
  if (policy.scheduledChange) return resolveScheduled(policy.scheduledChange, nowMs)

  return policy.enabled ? 'active' : 'unenforced'
}

/** The change a queued, executing or requested transaction makes; unset while the allowlist is in none. */
export const resolveAllowlistChange = (policy: AllowlistRow): AllowlistChange | undefined => {
  if (policy.status === 'active') {
    if (policy.awaitingGuardRemoval) return 'guard-removal'
    return policy.scheduledChange && delayedChangeOf(policy.scheduledChange.operation)
  }
  if (policy.appliesOnExecution) return 'setup'
  if (policy.step === 'remove-guard') return 'guard-removal'

  return delayedChangeOf(policy.operation)
}

const getTooltip = (policy: AllowlistRow, state: AllowlistState, nowMs: number): string | undefined => {
  if (state === 'processing') return PROCESSING_TOOLTIP
  if (state === 'failed') return FAILED_TOOLTIP

  if (policy.status === 'pending') {
    const waitingFor = isFullySigned(policy)
      ? AWAITING_EXECUTION_TOOLTIP
      : awaitingSignaturesTooltip({ signed: policy.confirmationsSubmitted, required: policy.confirmationsRequired })
    if (policy.step === 'apply' && policy.expiresAt !== undefined) {
      return `${waitingFor} ${executeByTooltip(policy.expiresAt)}`
    }

    return waitingFor
  }

  if (policy.status !== 'active') return undefined
  if (state === 'guard-removal-pending') return GUARD_REMOVAL_TOOLTIP

  const change = policy.scheduledChange
  if (!change) return undefined
  if (state === 'edit-expired' || state === 'removal-expired') return EXPIRED_TOOLTIP
  if (state === 'edit-ready-to-apply' || state === 'removal-ready-to-apply') {
    return readyToApplyTooltip(change.expiresAt)
  }

  return inDelayTooltip(change.appliesAt, change.expiresAt, nowMs)
}

/**
 * The allowlist's status as the table and the panel show it. `threshold` gives the guard removal that no transaction
 * holds yet the number of signatures it will need.
 */
export const getAllowlistStatus = (policy: AllowlistRow, nowMs: number, threshold?: number): AllowlistStatusBadge => {
  const state = resolveAllowlistState(policy, nowMs)
  let signatures: AllowlistSignatures | undefined
  if (policy.status === 'pending') {
    signatures = { signed: policy.confirmationsSubmitted, required: policy.confirmationsRequired }
  } else if (state === 'guard-removal-pending' && threshold !== undefined) {
    signatures = { signed: 0, required: threshold }
  }

  return {
    state,
    change: resolveAllowlistChange(policy),
    label: formatAllowlistStatus(state, signatures),
    variant: ALLOWLIST_STATUS[state].variant,
    tooltip: getTooltip(policy, state, nowMs),
  }
}
