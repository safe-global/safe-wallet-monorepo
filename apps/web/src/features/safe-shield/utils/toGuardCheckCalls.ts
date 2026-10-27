import type { SafeTransaction } from '@safe-global/types-kit'
import type { GuardCheckTransaction } from '@safe-global/utils/services/policy-guard'

/**
 * A built transaction as the one call the guard will check.
 *
 * A batch stays a single DELEGATECALL to MultiSend here, which is what the Safe executes and what
 * the guard sees: MultiSendPolicy re-checks the calls inside it.
 */
export const toGuardCheckCalls = (safeTx: SafeTransaction | undefined): GuardCheckTransaction[] | undefined => {
  if (!safeTx) return undefined

  const { to, value, data, operation = 0 } = safeTx.data
  return [{ to, value, data, operation }]
}
