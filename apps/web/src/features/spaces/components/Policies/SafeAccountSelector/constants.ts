/** Shared by the helper text and the empty state so the two cannot state different rules. */
export const ELIGIBILITY_RULE = 'signer or proposer'

export const ELIGIBILITY_HELPER_TEXT = `You only see accounts where you're a ${ELIGIBILITY_RULE}.`

export const NO_ELIGIBLE_ACCOUNTS_TEXT =
  `Your connected wallet isn't a ${ELIGIBILITY_RULE} on any Safe Account in this Workspace. ` +
  `Connect a different wallet to set up a policy.`

/** Used instead when no wallet is connected — there is none to blame or switch away from. */
export const NO_WALLET_TEXT = 'Connect a wallet to see the Safe Accounts you can set a policy on.'

export const SAFE_ACCOUNT_SELECTOR_LABEL = 'Which Safe Account does this apply to?'

export const SAFE_ACCOUNT_SELECTOR_PLACEHOLDER = 'Select Safe account'
