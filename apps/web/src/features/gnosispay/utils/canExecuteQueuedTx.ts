import type { GnosisPayTxItem } from '../types'

export const canExecuteQueuedTx = (item: GnosisPayTxItem, txNonce: bigint | undefined, now: number) =>
  txNonce !== undefined &&
  BigInt(item.queueNonce) === txNonce &&
  now >= item.executableAt &&
  (item.expiresAt === null || now < item.expiresAt)
