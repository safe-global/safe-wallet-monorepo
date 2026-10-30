import type { AllowlistRule } from '@/features/spaces'

export const pairKey = (tokenAddress: string, recipient: string): string =>
  `${tokenAddress.toLowerCase()}:${recipient.toLowerCase()}`

/** Case-insensitive `token:recipient` keys; the native token is the zero address. */
export const getAllowlistPairKeys = (rules: AllowlistRule[]): Set<string> =>
  new Set(
    rules.flatMap(({ tokenAddress, recipients }) => recipients.map((recipient) => pairKey(tokenAddress, recipient))),
  )
