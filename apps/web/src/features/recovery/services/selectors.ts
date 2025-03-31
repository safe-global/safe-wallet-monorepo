import { createSelector } from '@reduxjs/toolkit'

import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { RecoveryState } from '@/features/recovery/services/recovery-state'

// Identity function to help with type inference
function selectRecovery<T extends RecoveryState | undefined>(state: T): T {
  return state
}

export const selectDelayModifierByRecoverer = createSelector(
  [selectRecovery, (_: RecoveryState, walletAddress: string) => walletAddress],
  (recovery, walletAddress) => {
    return recovery?.find(({ recoverers }) => recoverers.some((recoverer) => sameAddress(recoverer, walletAddress)))
  },
)

export const selectRecoveryQueues = createSelector([selectRecovery], (recovery) => {
  return recovery?.flatMap(({ queue }) => queue).sort((a, b) => Number(a.timestamp - b.timestamp))
})

export const selectDelayModifierByTxHash = createSelector(
  [selectRecovery, (_: RecoveryState, txHash: string) => txHash],
  (recovery, txHash) => {
    return recovery?.find(({ queue }) => queue.some((item) => item.transactionHash === txHash))
  },
)

export const selectDelayModifierByAddress = createSelector(
  [selectRecovery, (_: RecoveryState, moduleAddress: string) => moduleAddress],
  (recovery, moduleAddress) => {
    return recovery?.find(({ address }) => sameAddress(address, moduleAddress))
  },
)
