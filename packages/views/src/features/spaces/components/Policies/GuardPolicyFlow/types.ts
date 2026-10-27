/** Every guard policy form starts with the Safe: `${chainId}:${address}`, the SafeScope key. */
export type GuardPolicyBaseFormValues = {
  safe: string
}

export type MultiSendPolicyFormValues = GuardPolicyBaseFormValues

export type SafeManagementFormValues = GuardPolicyBaseFormValues & {
  functionIds: string[]
  /** Only asked for when a guard change is left out. */
  guardLockConfirmed: boolean
}

export const createMultiSendFormValues = (safe = ''): MultiSendPolicyFormValues => ({ safe })

export const createSafeManagementFormValues = (
  functionIds: readonly string[],
  safe = '',
): SafeManagementFormValues => ({
  safe,
  functionIds: [...functionIds],
  guardLockConfirmed: false,
})
