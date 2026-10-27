export type RecipientAllowlistFormValues = {
  /** Token addresses; `''` for a row that has not picked one yet, `ZERO_ADDRESS` for the native coin. */
  tokens: Array<{ address: string }>
  recipients: Array<{ address: string }>
}

export const createRecipientAllowlistFormValues = (): RecipientAllowlistFormValues => ({
  tokens: [{ address: '' }],
  recipients: [{ address: '' }],
})
