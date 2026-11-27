import type { BaseDataDecoded, TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { getDeployedSpendingLimitModuleAddress } from '@/features/spending-limits/services'
import { isSpendingLimitMethod, type SpendingLimitMethods } from '@/utils/transaction-guards'

const ALLOWANCE_MODULE_METHODS = ['addDelegate', 'removeDelegate', 'setAllowance', 'resetAllowance', 'deleteAllowance']

export type SpendingLimitBatchChange = {
  method: SpendingLimitMethods
  dataDecoded: BaseDataDecoded
  resetsSpent: boolean
}

export type SpendingLimitBatch = {
  enablesModule: boolean
  changes: SpendingLimitBatchChange[]
  removedSpenders: string[]
}

const paramValue = (dataDecoded: BaseDataDecoded, index: number): string => {
  const value = dataDecoded.parameters?.[index]?.value
  return typeof value === 'string' ? value : ''
}

/**
 * Reads a multiSend made only of Allowance module calls (and the `enableModule` that turns it on) as spending limit
 * changes. Any other action makes it undefined, so a mixed batch never passes as a spending limit one.
 */
export const getSpendingLimitBatch = (
  txData: TransactionData | null | undefined,
  chainId: string,
): SpendingLimitBatch | undefined => {
  if (txData?.dataDecoded?.method !== 'multiSend') return

  const actions = txData.dataDecoded.parameters?.[0]?.valueDecoded
  if (!Array.isArray(actions) || actions.length === 0) return

  const isAllowanceModule = (address: string) => !!getDeployedSpendingLimitModuleAddress(chainId, [{ value: address }])

  const batch: SpendingLimitBatch = { enablesModule: false, changes: [], removedSpenders: [] }
  const resets: BaseDataDecoded[] = []

  for (const { to, dataDecoded } of actions) {
    if (!dataDecoded) return

    if (dataDecoded.method === 'enableModule' && isAllowanceModule(paramValue(dataDecoded, 0))) {
      batch.enablesModule = true
      continue
    }

    if (!isAllowanceModule(to) || !ALLOWANCE_MODULE_METHODS.includes(dataDecoded.method)) return

    if (isSpendingLimitMethod(dataDecoded.method)) {
      batch.changes.push({ method: dataDecoded.method as SpendingLimitMethods, dataDecoded, resetsSpent: false })
    } else if (dataDecoded.method === 'resetAllowance') {
      resets.push(dataDecoded)
    } else if (dataDecoded.method === 'removeDelegate') {
      batch.removedSpenders.push(paramValue(dataDecoded, 0))
    }
  }

  if (batch.changes.length === 0 && batch.removedSpenders.length === 0) return

  batch.changes = batch.changes.map((change) => ({
    ...change,
    resetsSpent: resets.some(
      (reset) =>
        sameAddress(paramValue(reset, 0), paramValue(change.dataDecoded, 0)) &&
        sameAddress(paramValue(reset, 1), paramValue(change.dataDecoded, 1)),
    ),
  }))

  return batch
}
