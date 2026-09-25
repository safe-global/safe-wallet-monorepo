import type { PendingPolicyOperation } from '../types'
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

/** The trailing full stop lives here, not at the call site, so the sentence is punctuated in one place. */
export const signedAndWaitingLine = (missing: number): string => `You've signed. ${formatAwaitingSignatures(missing)}.`
