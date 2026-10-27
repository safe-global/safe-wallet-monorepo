import { format } from 'date-fns'

export type PolicyMessageSeverity = 'error' | 'warn' | 'unavailable' | 'pass'

export type PolicyMessage = {
  severity: PolicyMessageSeverity
  message: string
}

const formatPolicyDate = (date: Date | number): string => format(date, 'd MMM, HH:mm')

/** Refusals by the recipient allowlist itself: the fix is to change the list or the transaction. */
const ALLOWLIST_MESSAGES = {
  'recipient-not-listed': ({ recipient }: { recipient: string }): PolicyMessage => ({
    severity: 'error',
    message: `${recipient} is not on this account's recipient allowlist. This transaction will be refused.`,
  }),
  'address-book-not-listed': ({ name }: { name: string }): PolicyMessage => ({
    severity: 'error',
    message: `${name} is in your address book but not on this allowlist.`,
  }),
  'asset-out-of-scope': ({
    recipient,
    allowedAsset,
    asset,
  }: {
    recipient: string
    allowedAsset: string
    asset: string
  }): PolicyMessage => ({
    severity: 'error',
    message: `${recipient} is listed for ${allowedAsset} only. ${asset} transfers to it are refused.`,
  }),
  'delay-pending': ({ recipient, date }: { recipient: string; date: Date | number }): PolicyMessage => ({
    severity: 'error',
    message: `${recipient} can receive funds from ${formatPolicyDate(date)}. Until then this is refused.`,
  }),
  'removal-pending': ({ recipient, date }: { recipient: string; date: Date | number }): PolicyMessage => ({
    severity: 'warn',
    message: `${recipient} comes off the list on ${formatPolicyDate(date)}. Execute before then or this will fail.`,
  }),
  'batch-partly-refused': ({ refused, total }: { refused: number; total: number }): PolicyMessage => ({
    severity: 'error',
    message: `${refused} of ${total} transfers go to addresses not on the allowlist. The whole batch is refused.`,
  }),
}

/** Refusals by the default decision: no policy covers the action at all. */
const DEFAULT_DECISION_MESSAGES = {
  'no-policy-contract-call': (): PolicyMessage => ({
    severity: 'error',
    message: 'No policy covers contract calls on this account. Only transfers to listed addresses are allowed.',
  }),
  'no-policy-nft': (): PolicyMessage => ({
    severity: 'error',
    message:
      'No policy covers NFT transfers on this account. Only token and native transfers to listed addresses are allowed.',
  }),
  'no-policy-safe-management': (): PolicyMessage => ({
    severity: 'error',
    message: 'No policy covers signer changes on this account. This is refused.',
  }),
}

export const POLICY_MESSAGES = {
  ...ALLOWLIST_MESSAGES,
  ...DEFAULT_DECISION_MESSAGES,
  unavailable: (): PolicyMessage => ({
    severity: 'unavailable',
    message: "Couldn't read this account's allowlist. This transaction may be refused.",
  }),
  // Copy undecided: it may overclaim.
  passed: (): PolicyMessage => ({ severity: 'pass', message: 'Policy checks passed' }),
}

export type PolicyMessageReason = keyof typeof POLICY_MESSAGES
