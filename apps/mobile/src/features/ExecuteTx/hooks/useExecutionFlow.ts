import { useCallback, useState } from 'react'
import { router } from 'expo-router'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { FeeParams } from '@/src/hooks/useFeeParams/useFeeParams'
import { Signer } from '@/src/store/signersSlice'
import {
  buildRouteParams,
  determineExecutionPath,
  getErrorMessage,
} from '@/src/features/ExecuteTx/components/ReviewAndExecute/helpers'
import { useIsMounted } from '@/src/hooks/useIsMounted'
import { RelaySimulationError } from '@safe-global/utils/services/relayErrors'

interface UseExecutionFlowParams {
  txId: string
  activeSigner: Signer | undefined
  isBiometricsEnabled: boolean
  executionMethod: ExecutionMethod
  feeParams: FeeParams
  execute: (acceptUnverifiedSimulation?: boolean) => Promise<void>
}

interface UseExecutionFlowReturn {
  isExecuting: boolean
  handleConfirmPress: () => Promise<void>
  showIndeterminateSheet: boolean
  dismissIndeterminateSheet: () => void
  confirmExecuteAnyway: () => Promise<void>
}

/**
 * Hook that starts and manages the execution flow.
 */
export const useExecutionFlow = ({
  txId,
  activeSigner,
  isBiometricsEnabled,
  executionMethod,
  feeParams,
  execute,
}: UseExecutionFlowParams): UseExecutionFlowReturn => {
  const [isExecuting, setIsExecuting] = useState(false)
  const [showIndeterminateSheet, setShowIndeterminateSheet] = useState(false)
  const isMounted = useIsMounted()

  const runExecution = useCallback(
    async (acceptUnverifiedSimulation?: boolean) => {
      try {
        setIsExecuting(true)
        await execute(acceptUnverifiedSimulation)

        if (isMounted()) {
          router.replace({
            pathname: '/execution-success',
            params: { txId },
          })
        }
      } catch (err) {
        if (!isMounted()) {
          return
        }
        setIsExecuting(false)

        // INDETERMINATE_SIMULATION: CGW couldn't complete the pre-relay simulation. Offer an explicit
        // "execute anyway" confirmation instead of failing.
        if (err instanceof RelaySimulationError && err.code === 'INDETERMINATE_SIMULATION') {
          setShowIndeterminateSheet(true)
          return
        }

        router.push({
          pathname: '/execution-error',
          params: { description: getErrorMessage(err) },
        })
      }
    },
    [execute, isMounted, txId],
  )

  const handleConfirmPress = useCallback(async () => {
    if (isExecuting) {
      return
    }

    const routeParams = buildRouteParams(txId, executionMethod, feeParams)
    const executionPath = determineExecutionPath(activeSigner, isBiometricsEnabled, executionMethod)

    // Ledger flow - navigate to Ledger connection screen
    if (executionPath === 'ledger') {
      router.push({
        pathname: '/execute-transaction/ledger-connect',
        params: routeParams,
      })
      return
    }

    // Biometrics flow - navigate to opt-in screen first
    if (executionPath === 'biometrics') {
      router.push({
        pathname: '/biometrics-opt-in',
        params: { ...routeParams, caller: '/review-and-execute' },
      })
      return
    }

    // WalletConnect and standard flow - execute directly
    await runExecution()
  }, [isExecuting, txId, executionMethod, feeParams, activeSigner, isBiometricsEnabled, runExecution])

  const dismissIndeterminateSheet = useCallback(() => {
    setShowIndeterminateSheet(false)
  }, [])

  const confirmExecuteAnyway = useCallback(async () => {
    setShowIndeterminateSheet(false)
    await runExecution(true)
  }, [runExecution])

  return {
    isExecuting,
    handleConfirmPress,
    showIndeterminateSheet,
    dismissIndeterminateSheet,
    confirmExecuteAnyway,
  }
}
