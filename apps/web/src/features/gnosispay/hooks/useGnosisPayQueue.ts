import { KnownContracts, getModuleInstance } from '@gnosis.pm/zodiac'
import { type OperationType } from '@safe-global/types-kit'
import { useEffect, useState } from 'react'
import useAsync, { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useIntervalCounter } from '@safe-global/utils/hooks/useIntervalCounter'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { logError, Errors } from '@/services/exceptions'
import { _getRecoveryStateItem, type RecoveryQueueItem } from '@/features/recovery/services'
import { useGnosisPayDelayModule } from './useGnosisPayDelayModule'
import type { GnosisPayTxItem } from '../types'

const REFRESH_INTERVAL = 30_000

const listeners = new Set<() => void>()

// Announce/execute/skip run in a modal over the queue page, so they refetch it without waiting for the poll
export const refreshGnosisPayQueue = () => listeners.forEach((listener) => listener())

export const _toGnosisPayQueue = (queue: RecoveryQueueItem[]): GnosisPayTxItem[] =>
  queue
    .map(({ args, validFrom, expiresAt }) => ({
      queueNonce: Number(args.queueNonce),
      txData: {
        to: args.to,
        value: args.value.toString(),
        data: args.data,
        operation: Number(args.operation) as OperationType,
      },
      executableAt: Number(validFrom),
      expiresAt: expiresAt === null ? null : Number(expiresAt),
    }))
    .sort((a, b) => a.queueNonce - b.queueNonce)

export const useGnosisPayQueue = (): AsyncResult<GnosisPayTxItem[]> => {
  const chainId = useChainId()
  const web3ReadOnly = useWeb3ReadOnly()
  const { safe, safeAddress } = useSafeInfo()
  const [delayModule] = useGnosisPayDelayModule()
  const [pollCount] = useIntervalCounter(REFRESH_INTERVAL)
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    const listener = () => setRefreshCount((count) => count + 1)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return useAsync(
    async () => {
      if (!delayModule || !web3ReadOnly) return

      const { queue } = await _getRecoveryStateItem({
        delayModifier: getModuleInstance(KnownContracts.DELAY, delayModule.value, web3ReadOnly),
        safeAddress,
        provider: web3ReadOnly,
        chainId,
        version: safe.version,
      }).catch((e) => {
        logError(Errors._603, e)
        throw e
      })

      return _toGnosisPayQueue(queue)
    },
    [delayModule, web3ReadOnly, safeAddress, chainId, safe.version, pollCount, refreshCount],
    false,
  )
}
