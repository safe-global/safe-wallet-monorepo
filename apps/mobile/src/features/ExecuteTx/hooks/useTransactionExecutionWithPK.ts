import { useCallback, useState } from 'react'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import type { RootState } from '@/src/store'
import { getPrivateKey } from '@/src/hooks/useSign/useSign'
import { executeTx } from '@/src/services/tx/tx-sender/execute'
import logger from '@/src/utils/logger'
import { addPendingTx, PendingTxType } from '@/src/store/pendingTxsSlice'
import { getUserNonce } from '@/src/services/web3'
import { EstimatedFeeValues } from '@/src/store/estimatedFeeSlice'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import { useRelayRelayV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/relay'
import { proposeTx } from '@/src/services/tx/tx-sender/create'
import { getReadOnlyCurrentGnosisSafeContract } from '@/src/services/contracts/safeContracts'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'
import useSafeInfo from '@/src/hooks/useSafeInfo'

export enum ExecutionStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  ERROR = 'error',
}

interface UseTransactionExecutionWithPKProps {
  txId: string
  signerAddress: string
  feeParams: EstimatedFeeValues | null
  executionMethod: ExecutionMethod
}

export function useTransactionExecutionWithPK({
  txId,
  signerAddress,
  executionMethod,
  feeParams,
}: UseTransactionExecutionWithPKProps) {
  const [status, setStatus] = useState<ExecutionStatus>(ExecutionStatus.IDLE)
  const dispatch = useAppDispatch()
  const activeSafe = useDefinedActiveSafe()
  const { safe } = useSafeInfo()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const [relayMutation] = useRelayRelayV1Mutation()

  const execute = useCallback(async () => {
    setStatus(ExecutionStatus.LOADING)

    let privateKey
    try {
      privateKey = await getPrivateKey(signerAddress)
    } catch (error) {
      logger.error('Error loading private key:', error)
      setStatus(ExecutionStatus.ERROR)
    }

    try {
      if (!privateKey) {
        setStatus(ExecutionStatus.ERROR)
        return
      }

      const walletNonce = await getUserNonce(activeChain, signerAddress)

      const { hash } = await executeTx({
        chain: activeChain,
        activeSafe,
        txId,
        privateKey,
        feeParams,
      })

      dispatch(
        addPendingTx({
          type: PendingTxType.SINGLE,
          txId,
          chainId: activeChain.chainId,
          safeAddress: activeSafe.address,
          txHash: hash,
          walletAddress: signerAddress,
          walletNonce,
        }),
      )

      setStatus(ExecutionStatus.PROCESSING)
    } catch (error) {
      logger.error('Error executing transaction:', error)
      setStatus(ExecutionStatus.ERROR)
    }
  }, [activeChain, activeSafe, txId, signerAddress, feeParams, dispatch])

  const executeInRelay = useCallback(async () => {
    setStatus(ExecutionStatus.LOADING)

    let privateKey
    try {
      privateKey = await getPrivateKey(signerAddress)
    } catch (error) {
      logger.error('Error loading private key:', error)
      setStatus(ExecutionStatus.ERROR)
      return
    }

    try {
      if (!privateKey) {
        setStatus(ExecutionStatus.ERROR)
        return
      }

      // Get the Safe transaction and signatures
      const { safeTx, signatures } = await proposeTx({
        activeSafe,
        txId,
        chain: activeChain,
        privateKey,
      })

      if (!safeTx) {
        throw new Error('Safe transaction not found')
      }

      // Add all signatures to the transaction
      Object.entries(signatures).forEach(([signer, data]) => {
        safeTx.addSignature({
          signer,
          data,
          staticPart: () => data,
          dynamicPart: () => '',
          isContractSignature: false,
        })
      })

      // Get readonly safe contract to encode the transaction
      const readOnlySafeContract = await getReadOnlyCurrentGnosisSafeContract(safe)

      // Encode the execTransaction call
      const data = readOnlySafeContract.encode('execTransaction', [
        safeTx.data.to,
        safeTx.data.value,
        safeTx.data.data,
        safeTx.data.operation,
        safeTx.data.safeTxGas,
        safeTx.data.baseGas,
        safeTx.data.gasPrice,
        safeTx.data.gasToken,
        safeTx.data.refundReceiver,
        safeTx.encodedSignatures(),
      ])

      // Call relay mutation
      const relayResponse = await relayMutation({
        chainId: activeChain.chainId,
        relayDto: {
          to: safe.address.value,
          data,
          version: safe.version ?? getLatestSafeVersion(activeChain),
        },
      }).unwrap()

      const taskId = relayResponse.taskId

      if (!taskId) {
        throw new Error('Transaction could not be relayed')
      }

      logger.info('Transaction relayed successfully', { taskId, txId, nonce: safeTx.data.nonce })

      dispatch(
        addPendingTx({
          type: PendingTxType.RELAY,
          txId,
          taskId,
          chainId: activeChain.chainId,
          safeAddress: activeSafe.address,
        }),
      )

      setStatus(ExecutionStatus.PROCESSING)
    } catch (error) {
      logger.error('Error relaying transaction:', error)
      setStatus(ExecutionStatus.ERROR)
    }
  }, [activeChain, activeSafe, safe, txId, signerAddress, feeParams, relayMutation])

  const retry = useCallback(() => {
    if (executionMethod === ExecutionMethod.RELAYER) {
      executeInRelay()
    } else {
      execute()
    }
  }, [execute, executeInRelay, executionMethod])

  return { status, executeTx: execute, executeInRelay, retry }
}
