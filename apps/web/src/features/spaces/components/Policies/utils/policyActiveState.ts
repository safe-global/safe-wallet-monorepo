import { isProposerPolicy, type Policy } from '../types'
import { POLICY_TYPE_LABELS } from './policyLabel'

export type PolicyActiveState = 'signer' | 'no-wallet' | 'not-signer'

/** Lower case, because these appear in the middle of a sentence in the footer. */
const POLICY_NOUNS: Record<Policy['type'], string> = {
  'spending-limit': 'spending limit',
  recovery: 'recovery policy',
  proposer: 'proposer grant',
}

export const getPolicyNoun = (policy: Policy): string => POLICY_NOUNS[policy.type]

export const getPolicyTypeLabel = (policy: Policy): string => POLICY_TYPE_LABELS[policy.type]

const equalsAddress = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

/**
 * Which of the three active states applies.
 *
 * The two states without a signer are kept apart because the footer treats them differently: with
 * no wallet there is one action to take, while a connected wallet that is not a signer needs to see
 * the actions it would have with a different wallet.
 */
export const getPolicyActiveState = (walletAddress: string | undefined, signers: string[]): PolicyActiveState => {
  if (!walletAddress) return 'no-wallet'
  return signers.some((signer) => equalsAddress(signer, walletAddress)) ? 'signer' : 'not-signer'
}

export const getActiveStateHelperText = (state: PolicyActiveState, policy: Policy): string | null => {
  if (state === 'no-wallet') return 'Connect a signer wallet to edit.'
  if (state === 'not-signer')
    return `Only signers of this Safe account can delete or edit this ${getPolicyNoun(policy)}.`
  return null
}

/**
 * A proposer grant can only be revoked by the owner who granted it. If that owner is no longer an
 * owner of the Safe, nobody can revoke the grant and the request fails on the server (WA-1026), so
 * the panel disables Delete instead of offering an action that cannot succeed.
 */
export const isOrphanedProposerGrant = (policy: Policy, signers: string[]): boolean =>
  isProposerPolicy(policy) && !signers.some((signer) => equalsAddress(signer, policy.data.grantedBy))

export const ORPHANED_GRANT_HELPER_TEXT =
  'The signer who granted this proposer is no longer an owner of this Safe account, so the grant can no longer be revoked.'
