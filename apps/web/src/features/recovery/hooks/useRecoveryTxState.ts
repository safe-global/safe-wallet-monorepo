import { useClock } from '../../../hooks/useClock'
import { selectDelayModifierByTxHash } from '@/features/recovery/services/selectors'
import recoveryStore from '@/features/recovery/components/RecoveryContext'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'

export function useRecoveryTxState({ validFrom, expiresAt, transactionHash, args, address }: RecoveryQueueItem): {
  isNext: boolean
  isExecutable: boolean
  isExpired: boolean
  isPending: boolean
  remainingSeconds: number
} {
  const { state, pending } = recoveryStore.useStore() || {}
  const recovery = state?.[0]
  const delayModifier = recovery && selectDelayModifierByTxHash(recovery, transactionHash)

  // We don't display seconds in the interface, so we can use a 60s interval
  const timestamp = useClock(60_000)
  const remainingMs = Number(validFrom) - timestamp

  const isValid = remainingMs <= 0
  const isExpired = expiresAt !== null ? Number(expiresAt) <= Date.now() : false

  // Check module address in case multiple Delay Modifiers enabled
  const isNext =
    !delayModifier ||
    (sameAddress(delayModifier.address, address) && BigInt(args.queueNonce) === BigInt(delayModifier.txNonce))
  const isExecutable = isNext && isValid && !isExpired
  const isPending = !!pending?.[args.txHash]

  const remainingSeconds = isValid ? 0 : Math.ceil(remainingMs / 1_000)

  return { isNext, isExecutable, isExpired, remainingSeconds, isPending }
}
