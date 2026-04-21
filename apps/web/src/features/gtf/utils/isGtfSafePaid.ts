import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import type { SafeTransaction } from '@safe-global/types-kit'

/**
 * True when the SafeTx carries GTF fee fields that would trigger `Safe.handlePayment()` on-chain.
 * Structural fingerprint of Safe-pays — catches any tx that will transfer a real payment out of
 * the Safe on execution. If true, execution must go via the intended relayer, otherwise the
 * signer pays network gas AND the Safe pays the fee (double-charge).
 */
export const isGtfSafePaid = (safeTxData: SafeTransaction['data']): boolean => {
  return (
    BigInt(safeTxData.gasPrice) > 0n && BigInt(safeTxData.baseGas) > 0n && safeTxData.refundReceiver !== ZERO_ADDRESS
  )
}
