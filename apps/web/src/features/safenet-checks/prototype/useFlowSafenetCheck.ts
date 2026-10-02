import { useContext } from 'react'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import useSafeInfo from '@/hooks/useSafeInfo'
import { isMultisigDetailedExecutionInfo } from '@/utils/transaction-guards'
import { getSafeTxHashFromTxId } from '@/utils/transactions'
import type { SafenetSignerRole } from './types'
import { resolveRole, useSafenetCheckState } from './useSafenetCheckState'
import { useSafenetScenario } from './useSafenetScenario'

/** The Safenet check for the tx in the current flow, and the viewer's role in it. */
export const useFlowSafenetCheck = (): {
  check: ReturnType<typeof useSafenetCheckState>
  role: SafenetSignerRole
  safeTxHash?: string
} => {
  const { isCreation, willExecute, onlyExecute, txId, txDetails } = useContext(TxFlowContext)
  const { safe } = useSafeInfo()
  const { scenario } = useSafenetScenario()

  const safeTxHash = txId ? getSafeTxHashFromTxId(txId) : undefined
  const multisigInfo =
    txDetails && isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)
      ? txDetails.detailedExecutionInfo
      : undefined
  const signatures = multisigInfo?.confirmations.length ?? 0
  const threshold = multisigInfo?.confirmationsRequired ?? safe.threshold
  const completesThreshold = signatures + 1 >= threshold

  const role = resolveRole(scenario.role, { isCreation, willExecute, onlyExecute, completesThreshold })
  const check = useSafenetCheckState(safeTxHash)

  return { check, role, safeTxHash }
}
