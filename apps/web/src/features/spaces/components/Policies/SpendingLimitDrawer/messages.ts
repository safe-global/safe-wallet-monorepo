import type { PendingPolicyOperation } from '../types'
import type { PendingTxOutcome } from './resolveState'
import { formatAwaitingSignatures } from './format'

export const PENDING_BANNER_TITLE: Record<PendingPolicyOperation, string> = {
  create: 'The spending limit is not active as the transaction is not yet executed.',
  remove: 'This spending limit is still active until the removal is executed.',
  update: 'The current limits still apply until the change is executed.',
}

const OPERATION_TAIL: Record<PendingPolicyOperation, string> = {
  create: 'to activate',
  remove: 'to remove it',
  update: 'to apply the change',
}

export const signAndExecuteLine = (operation: PendingPolicyOperation): string =>
  `Sign and execute the transaction ${OPERATION_TAIL[operation]}.`

export const executeLine = (operation: PendingPolicyOperation): string =>
  `Execute the transaction ${OPERATION_TAIL[operation]}.`

export const CONNECT_TO_SIGN_LINE = 'Connect a signer wallet to sign this transaction.'

export const connectHelper = (safeName: string): string => `Connect a signer wallet of ${safeName} to sign.`

export const ACTIVE_CONNECT_HELPER = 'Connect a signer wallet to edit.'

export const NOT_A_SIGNER_HELPER = 'Only signers of this Safe account can edit this spending limit.'

export const UNENFORCED_HELPER =
  'The allowance module is not enabled on this Safe account, so this limit is not enforced.'

export const TX_LOAD_FAILED_HELPER = "The transaction couldn't be loaded."

/** The page withholds `onEdit` only when the Workspace's plan does not include policies. */
export const EDIT_LOCKED_HELPER = 'Upgrade to Business to edit spending limits.'

/** The trailing full stop lives here, not at the call site, so the sentence is punctuated in one place. */
export const signedAndWaitingLine = (missing: number): string => `You've signed. ${formatAwaitingSignatures(missing)}.`

export const PENDING_OUTCOME_TITLE: Record<PendingTxOutcome, string> = {
  executed: 'The transaction was executed.',
  failed: 'The transaction failed and can no longer be executed.',
  replaced: 'Another transaction used this nonce, so this one can no longer be executed.',
  deleted: 'The transaction was deleted.',
}

const EXECUTED_LINE: Record<PendingPolicyOperation, string> = {
  create: 'The spending limit will show as active shortly.',
  update: 'The new limits will show shortly.',
  remove: 'The spending limit will disappear shortly.',
}

export const outcomeLine = (outcome: PendingTxOutcome, operation: PendingPolicyOperation): string =>
  outcome === 'executed' ? EXECUTED_LINE[operation] : 'Close this panel to see the current policies.'
