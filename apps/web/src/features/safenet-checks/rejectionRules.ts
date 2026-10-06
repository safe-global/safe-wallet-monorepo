export const SAFENET_RULE_IDS = ['R-4.1', 'R-4.2', 'R-4.3', 'R-4.4', 'R-4.5', 'R-4.6'] as const

export type SafenetRuleId = (typeof SAFENET_RULE_IDS)[number]

export type SafenetRuleCopy = {
  label: string
  description: string
}

/** UI copy for each Arbitration Charter rule a sentinel can cite. Sentinels send only the code. */
export const SAFENET_RULES: Record<SafenetRuleId, SafenetRuleCopy> = {
  'R-4.1': {
    label: 'Safe account settings change',
    description:
      "This transaction changes your Safe account's settings, such as signers or threshold. Safenet flags every settings change, so this is expected if your team made it.",
  },
  'R-4.2': {
    label: 'Unknown delegate call',
    description:
      "This transaction uses delegate call to a contract Safenet doesn't recognise. That contract could change your Safe account's setup.",
  },
  'R-4.3': {
    label: 'Lookalike recipient',
    description:
      'Funds go to an address that looks like one this Safe account has used before. This is a sign of address poisoning.',
  },
  'R-4.4': {
    label: 'Lookalike spender',
    description:
      'This transaction lets an address that looks like a known one spend your tokens, or sends swap proceeds outside this Safe account.',
  },
  'R-4.5': {
    label: 'Excessive approval',
    description:
      'This transaction approves an unlimited amount, a whole NFT collection, or more than the swap order needs.',
  },
  'R-4.6': {
    label: 'Blocklisted address',
    description: "This transaction interacts with an address on Safenet's list of malicious or compromised addresses.",
  },
}

export const isSafenetRuleId = (value: string): value is SafenetRuleId =>
  (SAFENET_RULE_IDS as readonly string[]).includes(value)
