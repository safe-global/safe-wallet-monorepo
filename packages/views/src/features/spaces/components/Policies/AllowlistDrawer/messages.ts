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

export const SCHEDULED_BANNER_TITLE: Record<'create' | 'update', string> = {
  create: 'The allowlist can only be applied in 24 hours.',
  update: 'Change pending',
}

export const SCHEDULED_BANNER_LINE: Record<'create' | 'update', string> = {
  create:
    "Come back after the wait to apply it with a second transaction. Until then, transactions aren't checked against it.",
  update: 'Any signer can cancel it before then.',
}

export const CANCEL_CONNECT_HELPER = 'Connect a signer wallet to cancel the change.'

export const CANCEL_NOT_A_SIGNER_HELPER = 'Only signers of this Safe account can cancel this change.'

export const UNENFORCED_BANNER_TITLE = 'Safe policy guard removed'

export const UNENFORCED_BANNER_LINE = 'Allowlist not applied as the guard is removed.'

export const NOT_COVERED_BADGE = 'Not covered'

export const NOT_COVERED_LINE = 'They can still send any token to any address. Edit the allowlist to include them.'

export const READY_BANNER_TITLE: Record<'create' | 'update', string> = {
  create: 'The 24-hour wait is over. Apply the allowlist to turn it on.',
  update: 'The 24-hour wait is over. Apply the change to use the new rules.',
}

export const READY_BANNER_LINE = "Applying is a second transaction that needs the Safe account's signatures."

export const EXPIRED_BANNER_TITLE: Record<'create' | 'update', string> = {
  create: 'This request expired. The allowlist was never applied.',
  update: 'This request expired. The change was never applied.',
}

export const EXPIRED_BANNER_LINE: Record<'create' | 'update', string> = {
  create:
    "It wasn't applied within 7 days after the wait ended, so it can no longer be used. Add the allowlist again to retry.",
  update:
    "It wasn't applied within 7 days after the wait ended, so it can no longer be used. Edit the allowlist again to retry.",
}

export const APPLY_CONNECT_HELPER = 'Connect a signer wallet to apply the allowlist.'

export const APPLY_NOT_A_SIGNER_HELPER = 'Only signers of this Safe account can apply this allowlist.'
