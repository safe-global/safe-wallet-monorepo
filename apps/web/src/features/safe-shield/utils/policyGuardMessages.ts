import type { GuardAction, GuardCheckResult } from '@safe-global/utils/services/policy-guard'

export type PolicyGuardMessage = {
  title: string
  description: string
  /** What the user can do about it. Absent when the transaction is permitted. */
  fix?: string
}

export const PERMITTED: PolicyGuardMessage = {
  title: 'Allowed by this Safe’s policies',
  description: 'The policy guard permits this transaction.',
}

/** The action is one the policy engine models, so the fix is the policy that would permit it. */
const FIX_BY_ACTION: Record<Exclude<GuardAction, 'other'>, string> = {
  'erc20-transfer': 'Add the recipient to this token’s allowlist policy, or choose a recipient that is already on it.',
  'native-transfer':
    'Add the recipient to the native token allowlist policy, or choose a recipient that is already on it.',
  multisend:
    'Batches are governed by the batched transactions policy, and every call inside the batch must be permitted on its own. Set up that policy, or check which call in the batch is blocked.',
  'safe-management':
    'Allow this change in the Safe management policy. Changes left out of it follow this Safe’s fallback policy.',
}

const CUSTOM_POLICY_FIX =
  'The policy guard does not permit this action. It needs a custom policy before this Safe can run it.'

const fixFor = (action: GuardAction | undefined): string =>
  action && action !== 'other' ? FIX_BY_ACTION[action] : CUSTOM_POLICY_FIX

/**
 * What to tell a signer about the guard's verdict.
 *
 * `no-policy` and `denied` read differently on purpose: nothing covering an action is a gap to fill,
 * while a policy that rejected it is a rule being enforced, and the two have different remedies.
 */
export const describeGuardCheck = (
  result: GuardCheckResult,
  action: GuardAction | undefined,
): PolicyGuardMessage | undefined => {
  switch (result.status) {
    case 'allowed':
      return PERMITTED

    case 'no-policy':
      return {
        title: 'Blocked: no policy covers this action',
        description: 'This Safe’s policy guard only permits what a policy allows, and nothing covers this transaction.',
        fix: fixFor(action),
      }

    case 'denied':
      return {
        title: 'Blocked by a policy on this Safe',
        description:
          result.reason === 'Unauthorized'
            ? 'A policy is set up for this action and does not permit it as configured.'
            : 'A policy is set up for this action and rejected it.',
        fix: fixFor(action),
      }

    case 'unsupported':
      return {
        title: 'The policy guard refuses this transaction',
        description: result.reason,
        fix: 'Rebuild the transaction without a gas refund, which this Safe’s guard does not support.',
      }

    // Nothing recognisable came back, so the signer is told nothing rather than something wrong.
    case 'unknown':
      return undefined
  }
}
