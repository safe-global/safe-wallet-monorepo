import { useCallback, useState } from 'react'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import type { RootState } from '@/src/store'
import logger from '@/src/utils/logger'
import { addPendingTx } from '@/src/store/pendingTxsSlice'
import { startExecuting, setExecutingSuccess, setExecutingError } from '@/src/store/executingStateSlice'
import { EstimatedFeeValues } from '@/src/store/estimatedFeeSlice'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { useRelayRelayV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import useSafeInfo from '@/src/hooks/useSafeInfo'
import { executePrivateKeyTx } from '@/src/services/tx-execution/privateKeyExecutor'
import { executeRelayTx } from '@/src/services/tx-execution/relayExecutor'
import { executeLedgerTx } from '@/src/services/tx-execution/ledgerExecutor'
import { executeWalletConnectTx } from '@/src/services/tx-execution/walletConnectExecutor'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import type { Provider } from '@reown/appkit-common-react-native'

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
  wcProvider?: Provider
}

export function useTransactionExecution({
  txId,
  signerAddress,
  executionMethod,
  feeParams,
  wcProvider,
}: UseTransactionExecutionProps) {
  const [status, setStatus] = useState<ExecutionStatus>(ExecutionStatus.IDLE)
  const dispatch = useAppDispatch()
  const activeSafe = useDefinedActiveSafe()
  const { safe } = useSafeInfo()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const [relayMutation] = useRelayRelayV1Mutation()

  // Hashmap of execution methods to their executor functions
  const executors = {
    [ExecutionMethod.WITH_PK]: async () => {
      return await executePrivateKeyTx({
        chain: activeChain,
        activeSafe,
        txId,
        signerAddress,
        feeParams,
      })
    },
    [ExecutionMethod.WITH_RELAY]: async (acceptUnverifiedSimulation?: boolean) => {
      return await executeRelayTx({
        chain: activeChain,
        activeSafe,
        safe,
        txId,
        acceptUnverifiedSimulation,
        relayMutation: async (args) => {
          const result = await relayMutation(args).unwrap()
          return result
        },
      })
    },
    [ExecutionMethod.WITH_LEDGER]: async () => {
      return await executeLedgerTx({
        chain: activeChain,
        activeSafe,
        txId,
        signerAddress,
        feeParams,
      })
    },
    [ExecutionMethod.WITH_WC]: async () => {
      if (!wcProvider) {
        throw new Error('WalletConnect provider not available')
      }
      return await executeWalletConnectTx({
        chain: activeChain,
        activeSafe,
        txId,
        signerAddress,
        provider: wcProvider,
      })
    },
  }

  const execute = useCallback(
    async (acceptUnverifiedSimulation?: boolean) => {
      setStatus(ExecutionStatus.LOADING)
      dispatch(startExecuting({ txId, executionMethod }))

      try {
        const executor = executors[executionMethod]

        if (!executor) {
          throw new Error(`No executor found for execution method: ${executionMethod}`)
        }

        const pendingTxPayload = await executor(acceptUnverifiedSimulation)

        dispatch(setExecutingSuccess(txId))
        dispatch(addPendingTx(pendingTxPayload))

        setStatus(ExecutionStatus.PROCESSING)
      } catch (error) {
        logger.error('Error executing transaction:', error)
        setStatus(ExecutionStatus.ERROR)
        dispatch(setExecutingError({ txId, error: asError(error).message }))

        // CGW's pre-relay simulation surfaces SIMULATION_FAILED / INDETERMINATE_SIMULATION as a typed
        // RelaySimulationError. It's re-thrown unchanged so useExecutionFlow can branch on it
        // (SIMULATION_FAILED is terminal, INDETERMINATE offers an explicit retry).
        throw error
      }
    },
    [
      executionMethod,
      activeChain,
      activeSafe,
      safe,
      txId,
      signerAddress,
      feeParams,
      relayMutation,
      wcProvider,
      dispatch,
    ],
  )

  return { status, execute }
}
