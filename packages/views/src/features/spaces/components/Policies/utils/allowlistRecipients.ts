import type { AllowlistPolicyData } from '../types'

/** The distinct recipient addresses across every token, in first-seen order. */
export const getAllowlistRecipients = ({ entries }: AllowlistPolicyData): string[] => {
  const byAddress = new Map<string, string>()
  for (const { recipients } of entries) {
    for (const { account } of recipients) {
      if (!byAddress.has(account.toLowerCase())) byAddress.set(account.toLowerCase(), account)
    }
  }

  return [...byAddress.values()]
}
