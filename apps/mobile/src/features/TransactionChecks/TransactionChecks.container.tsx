import { useSimulation } from '@/src/features/TransactionChecks/tenderly/useSimulation'
import { useBlockaid } from '@/src/features/TransactionChecks/blockaid/useBlockaid'
import { createExistingTx } from '@/src/services/tx/tx-sender'
import extractTxInfo from '@/src/services/tx/extractTx'
import { useSafeInfo } from '@/src/hooks/useSafeInfo'
import { useEffect } from 'react'
import { RouteProp, useRoute } from '@react-navigation/native'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import React from 'react'
import { TransactionChecksView } from './components/TransactionChecksView'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveChain } from '@/src/store/chains'
import { isTxSimulationEnabled } from '@safe-global/utils/components/tx/security/tenderly/utils'
import { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { useTransactionSigner } from '@/src/features/ConfirmTx/hooks/useTransactionSigner'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { useHasFeature } from '@/src/hooks/useHasFeature'

export const TransactionChecksContainer = () => {
  const { simulationData, simulateTransaction, simulationLink, _simulationRequestStatus } = useSimulation()
  const { scanTransaction, blockaidPayload, error: blockaidError, loading: blockaidLoading } = useBlockaid()
  const activeSafe = useDefinedActiveSafe()
  const safeInfo = useSafeInfo()
  const chain = useAppSelector(selectActiveChain)
  const simulationEnabled = chain ? isTxSimulationEnabled(chain) : false
  const blockaidEnabled = useHasFeature(FEATURES.RISK_MITIGATION) ?? false
  const txId = useRoute<RouteProp<{ params: { txId: string } }>>().params.txId

  const { txDetails, signerState } = useTransactionSigner(txId)
  const { activeSigner } = signerState

  useEffect(() => {
    const getSafeTx = async () => {
      if (!txDetails) {
        return
      }

      const { txParams, signatures } = extractTxInfo(txDetails, activeSafe.address)

      // TODO: There is now a hook useSafeTx to get this so it can be refactored
      const safeTx = await createExistingTx(txParams, signatures)
      const executionOwner = activeSigner ? activeSigner.value : safeInfo.safe.owners[0].value

      // Simulate with Tenderly if enabled
      await Promise.all(
        [
          simulationEnabled &&
            simulateTransaction({
              safe: safeInfo.safe as SafeInfo,
              executionOwner,
              transactions: safeTx,
            }),
          blockaidEnabled &&
            scanTransaction({
              data: safeTx,
              signer: executionOwner,
            }),
        ].filter(Boolean),
      )
    }

    getSafeTx()
  }, [txDetails])

  return (
    <TransactionChecksView
      tenderly={{
        enabled: simulationEnabled,
        fetchStatus: _simulationRequestStatus,
        simulationLink,
        simulation: simulationData,
      }}
      blockaid={{ enabled: blockaidEnabled, loading: blockaidLoading, error: blockaidError, payload: blockaidPayload }}
    />
  )
}
