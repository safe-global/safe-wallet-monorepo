import type { EligibilityRule, SafeAccountIneligibility } from './types'

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

export const ELIGIBILITY_COPY: Record<EligibilityRule, EligibilityCopy> = {
  'signer-or-proposer': buildEligibilityCopy('signer or proposer'),
  signer: buildEligibilityCopy('signer'),
}

export const DEFAULT_ELIGIBILITY_RULE: EligibilityRule = 'signer-or-proposer'

export const ELIGIBILITY_RULE = ELIGIBILITY_COPY[DEFAULT_ELIGIBILITY_RULE].rule

export const ELIGIBILITY_HELPER_TEXT = ELIGIBILITY_COPY[DEFAULT_ELIGIBILITY_RULE].helperText

export const NO_ELIGIBLE_ACCOUNTS_TEXT = ELIGIBILITY_COPY[DEFAULT_ELIGIBILITY_RULE].noEligibleAccountsText

/** Used instead when no wallet is connected — there is none to blame or switch away from. */
export const NO_WALLET_TEXT = 'Connect a wallet to see the Safe Accounts you can set a policy on.'

export const LOAD_ERROR_TEXT = 'Failed to load Safe Accounts'

export const INELIGIBILITY_TEXT: Record<SafeAccountIneligibility, string> = {
  'not-activated': 'You need to activate this Safe before transacting',
}

export const SAFE_ACCOUNT_SELECTOR_LABEL = 'Which Safe Account does this apply to?'

export const SAFE_ACCOUNT_SELECTOR_PLACEHOLDER = 'Select Safe account'
