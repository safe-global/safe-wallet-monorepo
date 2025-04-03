import { useSimulation } from '@/src/features/TransactionChecks/tenderly/useSimulation'
import { createExistingTx } from '@/src/services/tx/tx-sender'
import extractTxInfo from '@/src/services/tx/extractTx'
import { useSafeInfo } from '@/src/hooks/useSafeInfo'
import { useEffect } from 'react'
import { RouteProp, useRoute } from '@react-navigation/native'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import {
  MultisigExecutionDetails,
  useTransactionsGetTransactionByIdV1Query,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import React from 'react'
import { TransactionChecksView } from './components/TransactionChecksView'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'
import { isTxSimulationEnabled } from '@safe-global/utils/components/tx/security/tenderly/utils'
import { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { useTxSigner } from '@/src/features/ConfirmTx/hooks/useTxSigner'

export const TransactionChecksContainer = () => {
  const { simulation, simulateTransaction, simulationLink, _simulationRequestStatus } = useSimulation()
  const activeSafe = useDefinedActiveSafe()
  const safeInfo = useSafeInfo()
  const chain = useAppSelector(selectActiveChain)
  const simulationEnabled = chain ? isTxSimulationEnabled(chain) : false
  const txId = useRoute<RouteProp<{ params: { txId: string } }>>().params.txId

  const { data } = useTransactionsGetTransactionByIdV1Query({
    chainId: activeSafe.chainId,
    id: txId,
  })

  const { activeSigner } = useTxSigner(data?.detailedExecutionInfo as MultisigExecutionDetails)

  useEffect(() => {
    const getSafeTx = async () => {
      if (!data) {
        return
      }

      const { txParams, signatures } = extractTxInfo(data, activeSafe.address)

      const safeTx = await createExistingTx(txParams, signatures)

      await simulateTransaction({
        safe: safeInfo.safe as SafeInfo,
        executionOwner: activeSigner ? activeSigner.value : safeInfo.safe.owners[0].value,
        transactions: safeTx,
      })
    }

    getSafeTx()
  }, [data])

  return (
    <TransactionChecksView
      tenderly={{ enabled: simulationEnabled, fetchStatus: _simulationRequestStatus, simulationLink, simulation }}
    />
  )
}
