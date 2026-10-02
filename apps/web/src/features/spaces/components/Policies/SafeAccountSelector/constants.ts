import type { SafeAccountIneligibility } from './types'

type EligibilityCopy = {
  rule: string
  helperText: string
  noEligibleAccountsText: string
}

/** Built from one rule wording so the helper text and the empty state cannot state different rules. */
const buildEligibilityCopy = (rule: string): EligibilityCopy => ({
  rule,
  helperText: `You only see accounts where you're a ${rule}.`,
  noEligibleAccountsText:
    `Your connected wallet isn't a ${rule} on any Safe Account in this Workspace. ` +
    `Connect a different wallet to set up a policy.`,
})

const DEFAULT_COPY = buildEligibilityCopy('signer or proposer')

export const SIGNERS_ONLY_COPY = buildEligibilityCopy('signer')

export const getEligibilityCopy = (signersOnly: boolean): EligibilityCopy =>
  signersOnly ? SIGNERS_ONLY_COPY : DEFAULT_COPY

export const ELIGIBILITY_RULE = DEFAULT_COPY.rule

export const ELIGIBILITY_HELPER_TEXT = DEFAULT_COPY.helperText

export const NO_ELIGIBLE_ACCOUNTS_TEXT = DEFAULT_COPY.noEligibleAccountsText

/** Used instead when no wallet is connected — there is none to blame or switch away from. */
export const NO_WALLET_TEXT = 'Connect a wallet to see the Safe Accounts you can set a policy on.'

export const LOAD_ERROR_TEXT = 'Failed to load Safe Accounts'

export const INELIGIBILITY_TEXT: Record<SafeAccountIneligibility, string> = {
  'not-activated': 'You need to activate this Safe before transacting',
  'unsupported-chain':
    "Spending limits on this network aren't supported in the Workspace view. Set them up in the Safe account settings.",
  'no-spending-limits':
    "The spending limit module isn't deployed on this chain yet, so new spending limits can't be created here.",
}

export const SAFE_ACCOUNT_SELECTOR_LABEL = 'Which Safe Account does this apply to?'

export const SAFE_ACCOUNT_SELECTOR_PLACEHOLDER = 'Select Safe account'

export const NESTED_SAFES_NOTICE_TITLE = 'Nested Safe accounts'

/** Each flow names what it manages, so the notice points at the right settings page. */
export const getNestedSafesNoticeText = (policy: 'proposers' | 'spending limits') =>
  `To manage ${policy} for the Nested Safe accounts, go to the Safe account settings.`
