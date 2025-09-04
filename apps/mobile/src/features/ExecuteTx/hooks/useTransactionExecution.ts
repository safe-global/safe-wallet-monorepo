import { useCallback, useState } from 'react'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import type { RootState } from '@/src/store'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { getPrivateKey } from '@/src/hooks/useSign/useSign'
import { executeTx } from '@/src/services/tx/tx-sender/execute'
import logger from '@/src/utils/logger'

export type ExecutionStatus = 'idle' | 'loading' | 'success' | 'error'

interface UseTransactionExecutionProps {
  txId: string
  signerAddress: string
}

export function useTransactionExecution({ txId, signerAddress }: UseTransactionExecutionProps) {
  const [status, setStatus] = useState<ExecutionStatus>('idle')
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))

  const execute = useCallback(async () => {
    setStatus('loading')

    try {
      const privateKey = await getPrivateKey(signerAddress)

      if (!privateKey) {
        setStatus('error')
        return
      }

      await executeTx({
        chain: activeChain as ChainInfo,
        activeSafe,
        txId,
        privateKey,
      })
      setStatus('success')
    } catch (error) {
      logger.error('Error executing transaction:', error)
      setStatus('error')
    }
  }, [activeChain, activeSafe, txId, signerAddress])

  const retry = useCallback(() => {
    execute()
  }, [execute])

  return { status, executeTx: execute, retry }
}
