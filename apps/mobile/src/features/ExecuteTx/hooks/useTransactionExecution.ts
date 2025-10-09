import { useCallback, useState } from 'react'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import type { RootState } from '@/src/store'
import logger from '@/src/utils/logger'
import { addPendingTx } from '@/src/store/pendingTxsSlice'
import { EstimatedFeeValues } from '@/src/store/estimatedFeeSlice'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { useRelayRelayV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import useSafeInfo from '@/src/hooks/useSafeInfo'
import { executeSingleTx } from '@/src/services/tx-execution/single'
import { executeRelayTx } from '@/src/services/tx-execution/relay'

export enum ExecutionStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  ERROR = 'error',
}

interface UseTransactionExecutionProps {
  txId: string
  signerAddress: string
  feeParams: EstimatedFeeValues | null
  executionMethod: ExecutionMethod
}

export function useTransactionExecution({
  txId,
  signerAddress,
  executionMethod,
  feeParams,
}: UseTransactionExecutionProps) {
  const [status, setStatus] = useState<ExecutionStatus>(ExecutionStatus.IDLE)
  const dispatch = useAppDispatch()
  const activeSafe = useDefinedActiveSafe()
  const { safe } = useSafeInfo()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const [relayMutation] = useRelayRelayV1Mutation()

  // Hashmap of execution methods to their executor functions
  const executors = {
    [ExecutionMethod.SIGNER]: async () => {
      return await executeSingleTx({
        chain: activeChain,
        activeSafe,
        txId,
        signerAddress,
        feeParams,
      })
    },
    [ExecutionMethod.RELAYER]: async () => {
      return await executeRelayTx({
        chain: activeChain,
        activeSafe,
        safe,
        txId,
        relayMutation: async (args) => {
          const result = await relayMutation(args).unwrap()
          return result
        },
      })
    },
  }

  const execute = useCallback(async () => {
    setStatus(ExecutionStatus.LOADING)

    try {
      const executor = executors[executionMethod]

      if (!executor) {
        throw new Error(`No executor found for execution method: ${executionMethod}`)
      }

      const pendingTxPayload = await executor()

      dispatch(addPendingTx(pendingTxPayload))

      setStatus(ExecutionStatus.PROCESSING)
    } catch (error) {
      logger.error('Error executing transaction:', error)
      setStatus(ExecutionStatus.ERROR)
    }
  }, [executionMethod, activeChain, activeSafe, safe, txId, signerAddress, feeParams, relayMutation, dispatch])

  const retry = useCallback(() => {
    execute()
  }, [execute])

  return { status, execute, retry }
}
