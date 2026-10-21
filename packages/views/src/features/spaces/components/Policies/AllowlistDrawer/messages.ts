import type { PendingPolicyOperation } from '../types'

export const PENDING_BANNER_TITLE: Record<PendingPolicyOperation, string> = {
  create: 'The allowlist is not active as the transaction is not yet executed.',
  remove: 'This allowlist is still active until the removal is executed.',
  update: 'The current recipients still apply until the change is executed.',
}

export const NOT_A_SIGNER_HELPER = 'Only signers of this Safe account can edit this allowlist.'
