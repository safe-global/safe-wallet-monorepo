import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { sameAddress } from '@safe-global/utils/utils/addresses'

export type SafePaidFingerprint = {
  gasPrice?: string | bigint | null
  baseGas?: string | bigint | null
  refundReceiver?: string | null
}

/**
 * True when the SafeTx carries GTF fee fields that would trigger `Safe.handlePayment()` on-chain.
 * Structural fingerprint of Safe-pays — catches any tx that will transfer a real payment out of
 * the Safe on execution. If true, execution must go via the intended relayer, otherwise the
 * signer pays network gas AND the Safe pays the fee (double-charge).
 *
 * Accepts optional fields so callers can pass either a full `SafeTransaction['data']` or loose
 * scalars from CGW history responses; missing/zero values short-circuit to false.
 */
export const isGtfSafePaid = ({ gasPrice, baseGas, refundReceiver }: SafePaidFingerprint): boolean => {
  if (!gasPrice || !baseGas || !refundReceiver) return false
  return BigInt(gasPrice) > 0n && BigInt(baseGas) > 0n && !sameAddress(refundReceiver, ZERO_ADDRESS)
}
