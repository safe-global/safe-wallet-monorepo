import { useCallback, useMemo } from 'react'
import { useSimulation } from '@/src/features/TransactionChecks/tenderly/useSimulation'
import { useSafeInfo } from '@/src/hooks/useSafeInfo'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveSafe } from '@/src/store/activeSafeSlice'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import { selectChainById } from '@/src/store/chains'
import { isTxSimulationEnabled, getSimulationStatus } from '@safe-global/utils/components/tx/security/tenderly/utils'
import type { SafeTransaction } from '@safe-global/types-kit'
import { selectCachedSimulation } from '@/src/store/txSimulationSlice'
import { UseSimulationReturn } from '@safe-global/utils/components/tx/security/tenderly/useSimulation'

export const useTransactionSimulation = (safeTx?: SafeTransaction, txId?: string) => {
  const simulation = useSimulation(txId)
  const { safe } = useSafeInfo()
  const activeSafe = useAppSelector(selectActiveSafe)
  const activeSigner = useAppSelector((state) =>
    activeSafe ? selectActiveSigner(state, activeSafe.address) : undefined,
  )
  const cachedSimulation = useAppSelector((state) => selectCachedSimulation(state, txId))
  const chain = useAppSelector((state) => (activeSafe ? selectChainById(state, activeSafe.chainId) : undefined))

  const simulationEnabled = chain ? isTxSimulationEnabled(chain) : false

  const executionOwner = useMemo(() => {
    if (!safe || !activeSigner) {
      return undefined
    }
    // Check if active signer is an owner, otherwise use first owner
    const isOwner = safe.owners.some((owner) => owner.value === activeSigner.value)
    return isOwner ? activeSigner.value : safe.owners[0]?.value
  }, [safe, activeSigner])

  const canSimulate = useMemo(() => {
    return (
      simulationEnabled &&
      safeTx !== undefined &&
      safe !== undefined &&
      executionOwner !== undefined &&
      activeSafe !== null
    )
  }, [simulationEnabled, safeTx, safe, executionOwner, activeSafe])

  const runSimulation = useCallback(async () => {
    if (!canSimulate || !safeTx || !safe || !executionOwner || !activeSafe) {
      return
    }

    const safeState = {
      address: safe.address,
      chainId: safe.chainId,
      nonce: safe.nonce,
      threshold: safe.threshold,
      owners: safe.owners,
      implementation: safe.implementation,
      modules: safe.modules,
      fallbackHandler: safe.fallbackHandler,
      guard: safe.guard,
      version: safe.version,
      implementationVersionState: safe.implementationVersionState,
    }

    simulation.simulateTransaction({
      safe: safeState,
      executionOwner,
      transactions: safeTx,
    })
  }, [canSimulate, safeTx, safe, executionOwner, activeSafe, simulation])

  const simulationStatus = useMemo(
    () =>
      getSimulationStatus({
        ...simulation,
        simulationData: {
          simulation: {
            status: Boolean(cachedSimulation?.dataStatus),
          },
          transaction: {
            call_trace: cachedSimulation?.callTrace || [],
          },
        },
      } as UseSimulationReturn),
    [simulation, cachedSimulation],
  )

  return {
    enabled: simulationEnabled,
    isSimulating: simulationStatus.isLoading,
    hasError: simulationStatus.isError,
    isSuccess: simulationStatus.isSuccess,
    isCallTraceError: simulationStatus.isCallTraceError,
    simulationStatus,
    simulationData: simulation.simulationData,
    simulationLink: cachedSimulation?.link,
    requestError: cachedSimulation?.error,
    canSimulate,
    runSimulation,
  }
}
