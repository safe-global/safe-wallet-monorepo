import { useCallback, useState } from 'react'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppDispatch, useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import type { RootState } from '@/src/store'
import { getPrivateKey } from '@/src/hooks/useSign/useSign'
import { executeTx } from '@/src/services/tx/tx-sender/execute'
import logger from '@/src/utils/logger'
import { addPendingTx } from '@/src/store/pendingTxsSlice'
import { getUserNonce } from '@/src/services/web3'

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
}

export function useTransactionExecution({ txId, signerAddress }: UseTransactionExecutionProps) {
  const [status, setStatus] = useState<ExecutionStatus>(ExecutionStatus.IDLE)
  const dispatch = useAppDispatch()
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))

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
      })

      dispatch(
        addPendingTx({
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
  }, [activeChain, activeSafe, txId, signerAddress])

  const retry = useCallback(() => {
    execute()
  }, [execute])

  return { status, executeTx: execute, retry }
}
