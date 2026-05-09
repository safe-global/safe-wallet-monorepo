import { useCurrentChain } from '@/hooks/useChains'
import { useContext } from 'react'
import { TxInfoContext } from '@/components/tx-flow/TxInfoProvider'
import { useNestedTransaction } from '../components/useNestedTransaction'
import { isTxSimulationEnabled } from '@safe-global/utils/components/tx/security/tenderly/utils'
import { isSimulationError } from '@safe-global/utils/components/tx/security/tenderly/utils'
import { type SafeTransaction } from '@safe-global/types-kit'

export const useCheckSimulation = (safeTx?: SafeTransaction) => {
  const chain = useCurrentChain()
  const { status: simulationStatus, nestedTx } = useContext(TxInfoContext)
  const { isNested } = useNestedTransaction(safeTx, chain)
  const showSimulation = isTxSimulationEnabled(chain) && safeTx

  const hasSimulationError = showSimulation && isSimulationError(simulationStatus, nestedTx, isNested)

  return { hasSimulationError }
}
