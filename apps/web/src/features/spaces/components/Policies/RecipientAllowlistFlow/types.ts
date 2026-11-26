import type { AllowlistEntry } from '@safe-global/views/features/spaces/components/Policies/types'

/** A token as its chip and the review show it, so one no token list names keeps its symbol and logo. */
export type AllowlistToken = { address: string; symbol: string; logoUri?: string }

export type AllowlistFormRecipient = {
  address: string
  name?: string
  fromAddressBook?: boolean
}

export type RecipientAllowlistFormValues = {
  tokens: AllowlistToken[]
  recipients: AllowlistFormRecipient[]
}

export const createDefaultAllowlistValues = (): RecipientAllowlistFormValues => ({
  tokens: [],
  recipients: [],
})

/** `tokenAddress` is `ZERO_ADDRESS` for the native currency. */
export type AllowlistRule = { tokenAddress: string; recipients: string[] }

export type RecipientAllowlistFlowData = RecipientAllowlistFormValues & {
  rules: AllowlistRule[]
  /** The live allowlist being edited; its presence means edit mode. */
  baseline?: AllowlistEntry[]
  /** The guard holding the live allowlist's rules. */
  baselineGuard?: string
}
