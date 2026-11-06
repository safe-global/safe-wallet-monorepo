import { OperationType, type SafeTransaction } from '@safe-global/types-kit'
import type { GuardCheckTransaction } from '@safe-global/utils/services/policy-guard'

/** A built transaction as the one call the guard sees; a batch stays one DELEGATECALL to MultiSend. */
export const toGuardCheckCalls = (safeTx: SafeTransaction | undefined): GuardCheckTransaction[] | undefined => {
  if (!safeTx) return undefined

  const {
    to,
    value,
    data,
    operation = OperationType.Call,
    safeTxGas,
    baseGas,
    gasPrice,
    gasToken,
    refundReceiver,
  } = safeTx.data
  return [{ to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver }]
}
