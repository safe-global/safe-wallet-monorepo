import { KnownContracts, getModuleInstance } from '@gnosis.pm/zodiac'
import { type OperationType } from '@safe-global/types-kit'
import { useEffect, useState } from 'react'
import useAsync, { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { useIntervalCounter } from '@safe-global/utils/hooks/useIntervalCounter'
import useChainId from '@/hooks/useChainId'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { logError, Errors } from '@/services/exceptions'
import { readDelayState, type DelayQueueItem } from '@/services/delay/state'
import { useGnosisPayDelayModule } from '../public/hooks/useGnosisPayDelayModule'
import type { GnosisPayTxItem } from '../types'

const REFRESH_INTERVAL = 30_000

const listeners = new Set<() => void>()

// Announce/execute/skip run in a modal over the queue page, so they refetch it without waiting for the poll
export const refreshGnosisPayQueue = () => listeners.forEach((listener) => listener())

export const _toGnosisPayQueue = (queue: DelayQueueItem[], txNonce?: bigint): GnosisPayTxItem[] =>
  queue
    .map(({ args, validFrom, expiresAt }) => ({
      isNext: txNonce !== undefined && args.queueNonce === txNonce,
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
  const [delayModule, detectionError, detecting] = useGnosisPayDelayModule()
  const [pollCount] = useIntervalCounter(REFRESH_INTERVAL)
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    const listener = () => setRefreshCount((count) => count + 1)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const result = useAsync(
    async () => {
      if (!delayModule || !web3ReadOnly) return

      const { queue, txNonce } = await readDelayState({
        delayModifier: getModuleInstance(KnownContracts.DELAY, delayModule.value, web3ReadOnly),
        provider: web3ReadOnly,
        chainId,
      }).catch((e) => {
        logError(Errors._603, e)
        throw e
      })

      return _toGnosisPayQueue(queue, txNonce)
    },
    [delayModule, web3ReadOnly, chainId, pollCount, refreshCount],
    false,
  )
  return [result[0], detectionError ?? result[1], detecting || result[2]]
}
