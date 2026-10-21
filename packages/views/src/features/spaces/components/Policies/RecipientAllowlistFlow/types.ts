export type AllowlistRecipient = {
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
  recipients: AllowlistRecipient[]
}

export const createDefaultAllowlistValues = (): RecipientAllowlistFormValues => ({
  excludedTokens: [],
  addedTokens: [],
  recipients: [],
})

/** `tokenAddress` is `ZERO_ADDRESS` for the native currency. */
export type AllowlistRule = { tokenAddress: string; recipients: string[] }

export type RecipientAllowlistFlowData = RecipientAllowlistFormValues & { rules: AllowlistRule[] }
