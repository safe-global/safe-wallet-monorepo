/** Every guard policy form starts with the Safe: `${chainId}:${address}`, the SafeScope key. */
export type GuardPolicyBaseFormValues = {
  safe: string
}

export type TokenAllowlistFormValues = GuardPolicyBaseFormValues & {
  /** Token addresses; `''` for a row that has not picked one yet. */
  tokens: Array<{ address: string }>
  recipients: Array<{ address: string }>
}

export type MultiSendPolicyFormValues = GuardPolicyBaseFormValues

export type SafeManagementFormValues = GuardPolicyBaseFormValues & {
  functionIds: string[]
  /** Only asked for when a guard change is left out. */
  guardLockConfirmed: boolean
}

export const createTokenAllowlistFormValues = (safe = ''): TokenAllowlistFormValues => ({
  safe,
  tokens: [{ address: '' }],
  recipients: [{ address: '' }],
})

export const createMultiSendFormValues = (safe = ''): MultiSendPolicyFormValues => ({ safe })

/**
 * An existing allowlist as the form that would produce it. Editing is the same form with the
 * token fixed, so the row's token is the only one and its recipients are the starting list.
 */
export const toTokenAllowlistFormValues = (
  safe: string,
  tokenAddress: string,
  recipients: ReadonlyArray<{ address: string }>,
): TokenAllowlistFormValues => ({
  safe,
  tokens: [{ address: tokenAddress }],
  recipients: recipients.length > 0 ? recipients.map(({ address }) => ({ address })) : [{ address: '' }],
})

export const createSafeManagementFormValues = (
  functionIds: readonly string[],
  safe = '',
): SafeManagementFormValues => ({
  safe,
  functionIds: [...functionIds],
  guardLockConfirmed: false,
})
