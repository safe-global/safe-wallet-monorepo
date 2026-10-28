import type { PendingPolicyOperation } from '../types'
import type { PendingTxOutcome } from '../SpendingLimitDrawer/resolveState'
import { PENDING_OUTCOME_TITLE } from '../SpendingLimitDrawer/messages'

/** `expired`: the signing window closed before the transaction executed. */
export type AllowlistTxOutcome = PendingTxOutcome | 'expired'

export const PENDING_BANNER_TITLE: Record<PendingPolicyOperation, string> = {
  create: 'The allowlist is not active as the transaction is not yet executed.',
  remove: 'This allowlist is still active until the removal is executed.',
  update: 'The current recipients still apply until the change is executed.',
}

export const NOT_A_SIGNER_HELPER = 'Only signers of this Safe account can edit this allowlist.'

// Every change to the allowlist waits out the guard's 24-hour delay after execution.
const EXECUTED_LINE: Record<PendingPolicyOperation, string> = {
  create: 'The allowlist becomes active after the 24-hour delay.',
  update: 'The new rules apply after the 24-hour delay.',
  remove: 'The allowlist is removed after the 24-hour delay.',
}

export const OUTCOME_TITLE: Record<AllowlistTxOutcome, string> = {
  ...PENDING_OUTCOME_TITLE,
  expired: 'Transaction expired',
}

const EXPIRED_LINE = 'It can no longer be signed. Set up the allowlist again to retry.'

export const outcomeLine = (outcome: AllowlistTxOutcome, operation: PendingPolicyOperation): string => {
  if (outcome === 'executed') return EXECUTED_LINE[operation]

  return outcome === 'expired' ? EXPIRED_LINE : 'Close this panel to see the current policies.'
}

export const ACTIVATED_BANNER_TITLE = 'Your allowlist is now active'

export const activatedBannerLine = (safeName: string, recipientCount: number): string =>
  `${safeName} can only send the allowed tokens to the ${recipientCount} allowed ${recipientCount === 1 ? 'recipient' : 'recipients'}. Further changes will take 24 hours to apply.`

export const UNENFORCED_BANNER_TITLE = 'Safe policy guard removed'

export const UNENFORCED_BANNER_LINE = 'Allowlist not applied as the guard is removed.'

export const NOT_COVERED_BADGE = 'Not covered'

export const NOT_COVERED_LINE = 'They can still send any token to any address. Edit the allowlist to include them.'

/** A delayed request after `requestConfiguration` executed: waiting out the delay, in its apply window, or past it. */
export type ApplyStage = 'waiting' | 'ready' | 'expired'

type ApplyOperation = 'create' | 'update'

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

const formatHours = (hours: number): string => (hours === 1 ? '1 hour' : `${hours} hours`)

// A first allowlist reads as one thing ("it"); an edit reads as the changes ("they"), as in the design.
export const applyBannerTitle = (stage: ApplyStage, operation: ApplyOperation, hoursLeft: number): string => {
  const isCreate = operation === 'create'

  switch (stage) {
    case 'waiting':
      return `${isCreate ? 'Your allowlist' : 'Your changes'} can be applied in ${formatHours(hoursLeft)}`
    case 'ready':
      return isCreate ? 'Your allowlist is ready to apply' : 'Your changes are ready to apply'
    case 'expired':
      return isCreate ? 'Your allowlist expired' : 'Your changes expired'
  }
}

export type ApplyBannerDetails = {
  readyAt: string
  /** Unset when CGW does not know when the apply window closes. */
  endAt?: string
  /** Unset until the Safe's setup has loaded. */
  signatures?: { threshold: number; owners: number }
}

export const applyBannerLine = (
  stage: ApplyStage,
  operation: ApplyOperation,
  { readyAt, endAt, signatures }: ApplyBannerDetails,
): string => {
  const isCreate = operation === 'create'

  switch (stage) {
    case 'waiting':
      return isCreate
        ? `From ${readyAt}, a second transaction will need to be executed to apply it. Until then, transactions aren't checked against it.`
        : `From ${readyAt}, a second transaction will need to be executed to apply them. Until then, the current rules apply.`
    case 'ready': {
      const needs = signatures
        ? `It needs ${signatures.threshold} of ${signatures.owners} signatures`
        : "It needs the Safe account's signatures"
      const deadline = endAt ? ` and must be executed by ${endAt}` : ''

      return `${isCreate ? 'It takes' : 'They take'} effect once a second transaction is executed. ${needs}${deadline}.`
    }
    case 'expired': {
      const by = endAt ? `by ${endAt}` : 'in time'

      return isCreate
        ? `It wasn't applied ${by}, so it can't take effect anymore. Transactions aren't checked against an allowlist.`
        : `They weren't applied ${by}, so they can't take effect anymore. The current rules stay in place.`
    }
  }
}

export const APPLY_SIGNER_HELPER = 'Any signer can start this transaction.'

export const APPLY_CONNECT_HELPER = 'Connect a signer wallet to apply the allowlist.'

export const APPLY_NOT_A_SIGNER_HELPER = 'Only signers of this Safe account can apply this allowlist.'

export const DISCARD_LABEL = 'Discard'

export const EXPIRED_HELPER: Record<ApplyOperation, string> = {
  create: 'To use an allowlist, set it up again.',
  update: 'To make these changes, edit the allowlist again.',
}

export const SCHEDULED_BANNER_TITLE = 'Change pending'

export const SCHEDULED_BANNER_LINE: Record<'create' | 'update', string> = {
  create: "Until then, transactions aren't checked against it.",
  update: 'Any signer can cancel it before then.',
}

export const CANCEL_CONNECT_HELPER = 'Connect a signer wallet to cancel the change.'

export const CANCEL_NOT_A_SIGNER_HELPER = 'Only signers of this Safe account can cancel this change.'
