import { useCallback, useState } from 'react'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import type { RootState } from '@/src/store'
import { getPrivateKey } from '@/src/hooks/useSign/useSign'
import { executeTx } from '@/src/services/tx/tx-sender/execute'
import logger from '@/src/utils/logger'

export enum ExecutionStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

interface UseTransactionExecutionProps {
  txId: string
  signerAddress: string
}

export function useTransactionExecution({ txId, signerAddress }: UseTransactionExecutionProps) {
  const [status, setStatus] = useState<ExecutionStatus>(ExecutionStatus.IDLE)
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

      await executeTx({
        chain: activeChain,
        activeSafe,
        txId,
        privateKey,
      })
      setStatus(ExecutionStatus.SUCCESS)
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
