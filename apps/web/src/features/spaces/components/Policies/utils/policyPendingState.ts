import type { PendingPolicy, PendingPolicyOperation, Policy } from '../types'
import { getPolicyNoun } from './policyActiveState'

export type PolicyPendingState =
  | 'signer-not-signed'
  | 'no-wallet'
  | 'not-signer'
  | 'signer-has-signed'
  | 'fully-signed'
  | 'unavailable'

const equalsAddress = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

/**
 * Which pending state applies, from the connected wallet and the queued transaction.
 *
 * `unavailable` covers a transaction that can no longer be signed or executed: it was rejected or
 * replaced, or another transaction consumed its nonce. The panel has to say so, because every other
 * state offers an action that would fail.
 */
export const getPolicyPendingState = (
  policy: PendingPolicy,
  walletAddress: string | undefined,
  isSigner: boolean,
  isSuperseded = false,
): PolicyPendingState => {
  if (isSuperseded) return 'unavailable'
  if (policy.confirmationsSubmitted >= policy.confirmationsRequired) return 'fully-signed'
  if (!walletAddress) return 'no-wallet'
  if (!isSigner) return 'not-signer'

  const hasSigned = !policy.missingSigners.some((signer) => equalsAddress(signer, walletAddress))

  return hasSigned ? 'signer-has-signed' : 'signer-not-signed'
}

export const getOutstandingSignatures = (policy: PendingPolicy): number =>
  Math.max(0, policy.confirmationsRequired - policy.confirmationsSubmitted)

export const formatOutstandingSignatures = (count: number): string =>
  `${count} more ${count === 1 ? 'signature' : 'signatures'}`

/**
 * The first line of the banner, chosen by what the queued transaction would do.
 *
 * A queued creation is not yet active, but a queued removal or a queued reduction leaves the policy
 * active and enforced until the transaction executes. Reusing the creation wording for those would
 * tell a user that spending is already blocked when it is not.
 */
export const getPendingBannerTitle = (policy: Policy, operation: PendingPolicyOperation): string => {
  const noun = getPolicyNoun(policy)

  if (operation === 'create') return `The ${noun} is not active as the transaction is not yet executed.`
  if (operation === 'remove') return `The ${noun} stays active until the removal transaction is executed.`

  return `The ${noun} keeps its current limits until the change is executed.`
}

const OUTSTANDING_ACTION = 'Sign and execute the transaction to activate.'

/** The second line of the banner. Empty for the states where the user cannot act. */
export const getPendingBannerDetail = (state: PolicyPendingState, policy: PendingPolicy): string | null => {
  if (state === 'signer-not-signed') return OUTSTANDING_ACTION
  if (state === 'fully-signed') return 'Execute the transaction to activate.'
  if (state === 'signer-has-signed') {
    return `You've signed. Waiting for ${formatOutstandingSignatures(getOutstandingSignatures(policy))}.`
  }
  if (state === 'not-signer') return 'Only signers of this Safe account can sign this transaction.'

  return null
}
