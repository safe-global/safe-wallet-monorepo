import type { MetaTransactionData } from '@safe-global/types-kit'

export type GnosisPayTxItem = {
  queueNonce: number
  txData: MetaTransactionData
  executableAt: number
  /** null when the Delay modifier has no expiration */
  expiresAt: number | null
}
