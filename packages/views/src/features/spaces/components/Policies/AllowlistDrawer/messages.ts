import { differenceInDays, formatDistanceStrict } from 'date-fns'
import { IN_UTC, formatTimeUntil, formatUtcDate } from '@safe-global/utils/utils/date'
import type { AllowlistScheduledChange, PendingPolicyOperation } from '../types'
import type { PendingTxOutcome } from '../SpendingLimitDrawer/resolveState'
import { PENDING_OUTCOME_TITLE } from '../SpendingLimitDrawer/messages'

/** `expired`: the signing window closed before the transaction executed. */
export type AllowlistTxOutcome = PendingTxOutcome | 'expired'

export const PENDING_BANNER_TITLE: Record<PendingPolicyOperation, string> = {
  create: 'The allowlist is not active as the transaction is not yet executed.',
  remove: 'This allowlist is still active until the removal is executed.',
  update: 'The current recipients still apply until the change is executed.',
}

export const NOT_A_SIGNER_HELPER = 'Only signers of this Safe account can remove this allowlist.'

export const CONNECT_TO_REMOVE_HELPER = 'Connect a signer wallet to remove this allowlist.'

// Every change to the allowlist waits out the guard's delay after execution.
const EXECUTED_LINE: Record<PendingPolicyOperation, (changeDelay: string) => string> = {
  create: (changeDelay) => `After ${changeDelay}, a second transaction needs to be executed to activate the allowlist.`,
  update: (changeDelay) => `After ${changeDelay}, a second transaction needs to be executed to apply the new rules.`,
  remove: (changeDelay) => `After ${changeDelay}, a second transaction needs to be executed to remove the allowlist.`,
}

export const APPLIED_ON_EXECUTION_LINE = 'The allowlist is active now. It can take a moment to show here.'

export const OUTCOME_TITLE: Record<AllowlistTxOutcome, string> = {
  ...PENDING_OUTCOME_TITLE,
  expired: 'Transaction expired',
}

const EXPIRED_LINE = 'It can no longer be signed. Set up the allowlist again to retry.'

export const outcomeLine = (
  outcome: AllowlistTxOutcome,
  operation: PendingPolicyOperation,
  changeDelay: string,
): string => {
  if (outcome === 'executed') return EXECUTED_LINE[operation](changeDelay)

  return outcome === 'expired' ? EXPIRED_LINE : 'Close this panel to see the current policies.'
}

export const ACTIVATED_BANNER_TITLE = 'Your allowlist is now active'

export const activatedBannerLine = (safeName: string, recipientCount: number, changeDelay: string): string =>
  `${safeName} can only send the allowed tokens to the ${recipientCount} allowed ${recipientCount === 1 ? 'recipient' : 'recipients'}. Further changes will take ${changeDelay} to apply.`

export const UNENFORCED_BANNER_TITLE = 'Safe policy guard removed'

export const UNENFORCED_BANNER_LINE = 'Allowlist not applied as the guard is removed.'

export const NOT_COVERED_BADGE = 'Not covered'

export const NOT_COVERED_LINE = 'They can still send any token to any address. Edit the allowlist to include them.'

/** A delayed request after `requestConfiguration` executed: waiting out the delay, in its apply window, or past it. */
export type ApplyStage = 'waiting' | 'ready' | 'expired'

type ApplyOperation = AllowlistScheduledChange['operation']

export const APPLY_SECTION_TITLE: Record<ApplyStage, string> = {
  waiting: 'Waiting period',
  ready: 'Apply window',
  expired: 'Request',
}

export const APPLY_READY_LABEL: Record<ApplyStage, string> = {
  waiting: 'Can be applied from',
  ready: 'Ready since',
  expired: 'Ready since',
}

export const APPLY_END_LABEL: Record<ApplyStage, string> = {
  waiting: 'Apply by',
  ready: 'Apply by',
  expired: 'Expired',
}

export const REQUESTED_LABEL = 'Requested'

export const SAFE_ACCOUNT_LABEL = 'Safe account'

// A first allowlist reads as one thing ("it"); an edit reads as the changes ("they"), as in the design.
const WAITING_TITLE: Record<ApplyOperation, (timeLeft: string) => string> = {
  create: (timeLeft) => `Your allowlist can be applied in ${timeLeft}`,
  update: (timeLeft) => `Your changes can be applied in ${timeLeft}`,
  remove: (timeLeft) => `Your allowlist can be removed in ${timeLeft}`,
}

const READY_TITLE: Record<ApplyOperation, string> = {
  create: 'Your allowlist is ready to apply',
  update: 'Your changes are ready to apply',
  remove: 'Your allowlist is ready to remove',
}

const EXPIRED_TITLE: Record<ApplyOperation, string> = {
  create: 'Your allowlist expired',
  update: 'Your changes expired',
  remove: 'Your removal expired',
}

export const applyBannerTitle = (stage: ApplyStage, operation: ApplyOperation, timeLeft: string): string => {
  switch (stage) {
    case 'waiting':
      return WAITING_TITLE[operation](timeLeft)
    case 'ready':
      return READY_TITLE[operation]
    case 'expired':
      return EXPIRED_TITLE[operation]
  }
}

export type ApplyBannerDetails = {
  readyAt: string
  /** Unset when CGW does not know when the apply window closes. */
  endAt?: string
  /** Unset until the Safe's setup has loaded. */
  signatures?: { threshold: number; owners: number }
}

const WAITING_LINE: Record<ApplyOperation, (readyAt: string) => string> = {
  create: (readyAt) =>
    `From ${readyAt}, a second transaction will need to be executed to apply it. Until then, transactions aren't checked against it.`,
  update: (readyAt) =>
    `From ${readyAt}, a second transaction will need to be executed to apply them. Until then, the current rules apply.`,
  remove: (readyAt) =>
    `From ${readyAt}, a second transaction will need to be executed to remove it. Until then, the allowlist stays active.`,
}

const READY_LINE_START: Record<ApplyOperation, string> = {
  create: 'It takes effect once a second transaction is executed.',
  update: 'They take effect once a second transaction is executed.',
  remove: 'Its rules are deleted once a second transaction is executed, and the guard can then be removed.',
}

const EXPIRED_LINE_BY: Record<ApplyOperation, (by: string) => string> = {
  create: (by) =>
    `It wasn't applied ${by}, so it can't take effect anymore. Transactions aren't checked against an allowlist.`,
  update: (by) => `They weren't applied ${by}, so they can't take effect anymore. The current rules stay in place.`,
  remove: (by) => `It wasn't applied ${by}, so the allowlist stays active.`,
}

export const applyBannerLine = (
  stage: ApplyStage,
  operation: ApplyOperation,
  { readyAt, endAt, signatures }: ApplyBannerDetails,
): string => {
  switch (stage) {
    case 'waiting':
      return WAITING_LINE[operation](readyAt)
    case 'ready': {
      const needs = signatures
        ? `It needs ${signatures.threshold} of ${signatures.owners} signatures`
        : "It needs the Safe account's signatures"
      const deadline = endAt ? ` and must be executed by ${endAt}` : ''

      return `${READY_LINE_START[operation]} ${needs}${deadline}.`
    }
    case 'expired':
      return EXPIRED_LINE_BY[operation](endAt ? `by ${endAt}` : 'in time')
  }
}

export const APPLY_SIGNER_HELPER = 'Any signer can start this transaction.'

export const APPLY_CONNECT_HELPER = 'Connect a signer wallet to apply the allowlist.'

export const APPLY_NOT_A_SIGNER_HELPER = 'Only signers of this Safe account can apply this allowlist.'

export const DISCARD_LABEL = 'Discard'

export const EXPIRED_HELPER: Record<ApplyOperation, string> = {
  create: 'To use an allowlist, set it up again.',
  update: 'To make these changes, edit the allowlist again.',
  remove: 'To remove the allowlist, remove it again.',
}

export const GUARD_REMOVAL_BANNER_TITLE = 'Your allowlist is removed'

export const GUARD_REMOVAL_BANNER_LINE =
  "Remove the guard to finish. Until then, this Safe account can't send anything."

export const REMOVE_GUARD_LABEL = 'Remove guard'

export const REMOVE_GUARD_CONNECT_HELPER = 'Connect a signer wallet to remove the guard.'

export const REMOVE_GUARD_NOT_A_SIGNER_HELPER = 'Only signers of this Safe account can remove the guard.'

const MS_PER_SECOND = 1_000

const isLastDay = (until: number, nowMs: number): boolean => differenceInDays(until * MS_PER_SECOND, nowMs, IN_UTC) < 1

const daysLeft = (until: number, nowMs: number): string =>
  formatDistanceStrict(until * MS_PER_SECOND, nowMs, { ...IN_UTC, unit: 'day', roundingMethod: 'floor' })

/** `6 days left · until Oct 21, 2026`. Takes unix SECONDS; an expiry in the past is a closed state, not shown. */
export const timeToSignLine = (expiresAt: number, nowMs: number): string =>
  `${isLastDay(expiresAt, nowMs) ? 'Less than a day left' : `${daysLeft(expiresAt, nowMs)} left`} · until ${formatUtcDate(expiresAt)}`

/** `Apply in 23 hours 59 minutes`, for the button that stays disabled until the guard's delay is over. Takes unix SECONDS. */
export const applyInLabel = (appliesAt: number, nowMs: number): string =>
  `Apply in ${formatTimeUntil(appliesAt, nowMs)}`

/** `23 hours 59 minutes left` within the last day, else `6 days left`. Takes unix SECONDS. */
export const timeLeftLabel = (until: number, nowMs: number): string =>
  `${isLastDay(until, nowMs) ? formatTimeUntil(until, nowMs) : daysLeft(until, nowMs)} left`
