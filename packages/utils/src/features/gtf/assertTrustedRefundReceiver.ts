import { sameAddress } from '@safe-global/utils/utils/addresses'
import { isGtfSafePaid } from '@safe-global/utils/utils/isGtfSafePaid'
import { FEE_COLLECTORS } from './constants'

export type GtfFeeFields = {
  gasPrice?: string | bigint | null
  baseGas?: string | bigint | null
  refundReceiver?: string | null
}

export const isTrustedFeeCollector = (refundReceiver?: string | null): boolean =>
  FEE_COLLECTORS.some((collector) => sameAddress(collector, refundReceiver ?? undefined))

/**
 * Throws when a Safe-paid (GTF) payload carries a `refundReceiver` outside the trusted
 * fee-collector allowlist. Signer-pays and pre-GTF payloads carry no fee fields and pass
 * through untouched.
 *
 * Call this on every path that signs or submits a payload whose fee fields came from CGW —
 * the signature is what authorises `handlePayment()` to move funds to `refundReceiver`.
 */
export const assertTrustedRefundReceiver = (txData: GtfFeeFields, chainId: string): void => {
  if (!isGtfSafePaid(txData) || isTrustedFeeCollector(txData.refundReceiver)) {
    return
  }

  throw new Error(
    `Untrusted gas-fee recipient ${txData.refundReceiver} returned by CGW on chain ${chainId}. Refusing to proceed.`,
  )
}
