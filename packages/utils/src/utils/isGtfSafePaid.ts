import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { sameAddress } from '@safe-global/utils/utils/addresses'

/**
 * True when the SafeTx carries GTF fee fields that trigger `Safe.handlePayment()` on-chain —
 * i.e. a real Safe-pays payment. Accepts both full `SafeTransaction['data']` and loose CGW
 * history scalars; missing/zero values short-circuit to false.
 */
export const isGtfSafePaid = ({
  gasPrice,
  baseGas,
  refundReceiver,
}: {
  gasPrice?: string | bigint | null
  baseGas?: string | bigint | null
  refundReceiver?: string | null
}): boolean => {
  if (!gasPrice || !baseGas || !refundReceiver) return false
  return BigInt(gasPrice) > 0n && BigInt(baseGas) > 0n && !sameAddress(refundReceiver, ZERO_ADDRESS)
}
