import type { AllowlistEntry } from '@safe-global/views/features/spaces/components/Policies/types'

export type AllowlistFormRecipient = {
  address: string
  name?: string
  fromAddressBook?: boolean
  selected: boolean
}

export type RecipientAllowlistFormValues = {
  /** Token addresses deselected; every shown token is allowed until deselected. */
  excludedTokens: string[]
  /** Token addresses added via "Add a token". */
  addedTokens: string[]
  recipients: AllowlistFormRecipient[]
}

export const createDefaultAllowlistValues = (): RecipientAllowlistFormValues => ({
  excludedTokens: [],
  addedTokens: [],
  recipients: [],
})

/** `tokenAddress` is `ZERO_ADDRESS` for the native currency. */
export type AllowlistRule = { tokenAddress: string; recipients: string[] }

export type RecipientAllowlistFlowData = RecipientAllowlistFormValues & {
  rules: AllowlistRule[]
  /** The live allowlist being edited; its presence means edit mode. */
  baseline?: AllowlistEntry[]
}
