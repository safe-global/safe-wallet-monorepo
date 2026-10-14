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

export const createSafeManagementFormValues = (
  functionIds: readonly string[],
  safe = '',
): SafeManagementFormValues => ({
  safe,
  functionIds: [...functionIds],
  guardLockConfirmed: false,
})
