import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import useSafeInfo from '@/hooks/useSafeInfo'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { type SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { createExistingTx } from '@/services/tx/tx-sender'
import useChainId from '@/hooks/useChainId'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { useSimulation } from '@/components/tx/security/tenderly/useSimulation'
import { useSigner } from '@/hooks/wallets/useWallet'
import {
  getSimulationStatus,
  isTxSimulationEnabled,
  type SimulationStatus,
} from '@safe-global/utils/components/tx/security/tenderly/utils'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { useIsNestedSafeOwner } from '@/hooks/useIsNestedSafeOwner'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { useMemo } from 'react'
import { useCurrentChain } from '@/hooks/useChains'
import { useSafeProAccess } from '@/features/spaces'
import { useSafeLinkQuery } from '@/hooks/useSafeLinkQuery'
import { AppRoutes } from '@/config/routes'
import { useAppSelector } from '@/store'
import { selectHasOwnTenderly } from '@/store/settingsSlice'
import {
  _getSimulationIcon,
  _getSimulationStatusText,
  QueuedTxSimulationView,
  SimulationSetupLinkView,
} from '@views/components/transactions/QueuedTxSimulation/QueuedTxSimulationView'

export const _isSimulationSuccessful = ({ isSuccess, isError, isCallTraceError }: SimulationStatus): boolean =>
  isSuccess && !isError && !isCallTraceError

export { _getSimulationIcon, _getSimulationStatusText }

const SimulationSetupLink = () => {
  const safeLinkQuery = useSafeLinkQuery()

  return <SimulationSetupLinkView href={{ pathname: AppRoutes.settings.environmentVariables, query: safeLinkQuery }} />
}

const InlineTxSimulation = ({ transaction }: { transaction: TransactionDetails }) => {
  const { safe } = useSafeInfo()
  const isSafeOwner = useIsSafeOwner()
  const isNestedSafeOwner = useIsNestedSafeOwner()
  const chainId = useChainId()
  const signer = useSigner()
  const sdk = useSafeSDK()

  const canSimulate = isSafeOwner || isNestedSafeOwner

  const [safeTransaction, safeTransactionError] = useAsync(
    () => (sdk ? createExistingTx(chainId, transaction.txId, transaction) : undefined),
    [chainId, transaction, sdk],
  )

  const executionOwner = useMemo(
    () =>
      safe.owners.some((owner) => sameAddress(owner.value, signer?.address)) ? signer?.address : safe.owners[0]?.value,
    [safe.owners, signer?.address],
  )

  const simulation = useSimulation()
  const { simulationLink, simulateTransaction } = simulation
  const status = simulation ? getSimulationStatus(simulation) : undefined
  const { hasProFeatures, isLoading: isProAccessLoading } = useSafeProAccess()
  const hasOwnTenderly = useAppSelector(selectHasOwnTenderly)

  const handleSimulation = () => {
    if (safeTransaction && executionOwner) {
      simulateTransaction({ executionOwner, transactions: safeTransaction, safe: safe as SafeState })
    }
  }

  if (safeTransactionError || !canSimulate || !executionOwner || isProAccessLoading) {
    return null
  }

  // Without Safe Pro and without an own Tenderly project nothing is simulated; lead to settings to bring one, as Safe Shield does.
  if (!hasProFeatures && !hasOwnTenderly) {
    return <SimulationSetupLink />
  }

  if (status?.isLoading) {
    return <QueuedTxSimulationView isLoading />
  }

  if (!status?.isFinished) {
    return <QueuedTxSimulationView disabled={!safeTransaction} onSimulate={handleSimulation} />
  }

  if (status?.isFinished && !status.isError) {
    return <QueuedTxSimulationView result={{ isSuccessful: _isSimulationSuccessful(status), simulationLink }} />
  }

  if (status?.isError) {
    return <QueuedTxSimulationView isError />
  }

  return null
}

export const QueuedTxSimulation = ({ transaction }: { transaction: TransactionDetails }) => {
  const chain = useCurrentChain()

  if (!chain || !isTxSimulationEnabled(chain)) {
    return null
  }

  return <InlineTxSimulation transaction={transaction} />
}
