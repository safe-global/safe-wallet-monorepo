import type { TransactionAddedEvent } from '@gnosis.pm/zodiac/dist/cjs/types/Delay'

export type RecoveryQueueItem = TransactionAddedEvent.Log & {
  timestamp: bigint
  validFrom: bigint
  expiresAt: bigint | null
  isMalicious: boolean
  executor: string
}

export type RecoveryStateItem = {
  address: string
  recoverers: Array<string>
  expiry: bigint
  delay: bigint
  txNonce: bigint
  queueNonce: bigint
  queue: Array<RecoveryQueueItem>
}

export type RecoveryState = Array<RecoveryStateItem>
