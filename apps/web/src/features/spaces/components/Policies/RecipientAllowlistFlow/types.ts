import type { AllowlistRule } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/types'

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

export type { AllowlistRule }

export type RecipientAllowlistFlowData = RecipientAllowlistFormValues & { rules: AllowlistRule[] }
