import type { PendingPolicyOperation } from '../types'
import type { AllowlistTxOutcome } from './resolveState'
import { PENDING_OUTCOME_TITLE } from '../SpendingLimitDrawer/messages'

export const PENDING_BANNER_TITLE: Record<PendingPolicyOperation, string> = {
  create: 'The allowlist is not active as the transaction is not yet executed.',
  remove: 'This allowlist is still active until the removal is executed.',
  update: 'The current recipients still apply until the change is executed.',
}

export const NOT_A_SIGNER_HELPER = 'Only signers of this Safe account can edit this allowlist.'

// Every change to the allowlist waits out the guard's 24-hour delay after execution.
const EXECUTED_LINE: Record<PendingPolicyOperation, string> = {
  create: 'The allowlist applies after the 24-hour delay.',
  update: 'The new recipients apply after the 24-hour delay.',
  remove: 'The allowlist is removed after the 24-hour delay.',
}

export const OUTCOME_TITLE: Record<AllowlistTxOutcome, string> = {
  ...PENDING_OUTCOME_TITLE,
  expired: 'The transaction expired and can no longer be signed.',
}

export const outcomeLine = (outcome: AllowlistTxOutcome, operation: PendingPolicyOperation): string =>
  outcome === 'executed' ? EXECUTED_LINE[operation] : 'Close this panel to see the current policies.'

export const SCHEDULED_BANNER_TITLE = 'Change pending'

export const SCHEDULED_BANNER_LINE: Record<'create' | 'update', string> = {
  create: "Until then, transactions aren't checked against it.",
  update: 'Any signer can cancel it before then.',
}

export const CANCEL_CONNECT_HELPER = 'Connect a signer wallet to cancel the change.'

export const CANCEL_NOT_A_SIGNER_HELPER = 'Only signers of this Safe account can cancel this change.'

export const UNENFORCED_BANNER_TITLE = 'Safe policy guard removed'

export const UNENFORCED_BANNER_LINE = 'Allowlist not applied as the guard is removed.'
