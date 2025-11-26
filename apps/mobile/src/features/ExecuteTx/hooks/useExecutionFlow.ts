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

interface UseExecutionFlowParams {
  txId: string
  activeSigner: Signer | undefined
  isBiometricsEnabled: boolean
  executionMethod: ExecutionMethod
  feeParams: FeeParams
  execute: () => Promise<void>
}

interface UseExecutionFlowReturn {
  isExecuting: boolean
  handleConfirmPress: () => Promise<void>
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
  const isMounted = useIsMounted()

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

    // Standard flow - execute directly
    try {
      setIsExecuting(true)
      await execute()

      if (isMounted()) {
        router.replace({
          pathname: '/execution-success',
          params: { txId },
        })
      }
    } catch (err) {
      if (isMounted()) {
        setIsExecuting(false)
        router.push({
          pathname: '/execution-error',
          params: { description: getErrorMessage(err) },
        })
      }
    }
  }, [isExecuting, txId, executionMethod, feeParams, activeSigner, isBiometricsEnabled, execute, isMounted])

  return { isExecuting, handleConfirmPress }
}
