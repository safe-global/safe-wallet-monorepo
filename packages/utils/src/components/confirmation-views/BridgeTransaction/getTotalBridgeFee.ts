import type { BridgeFee } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

/**
 * Returns the total LiFi fee of a bridge or swap transaction.
 *
 * @param fees - The fees decoded by the gateway, or null if they could not be decoded
 * @returns The sum of the integrator and LiFi fees, or null if the fees are unknown
 */
export const getTotalBridgeFee = (fees: BridgeFee | null): bigint | null => {
  if (!fees) {
    return null
  }

  return BigInt(fees.integratorFee) + BigInt(fees.lifiFee)
}
