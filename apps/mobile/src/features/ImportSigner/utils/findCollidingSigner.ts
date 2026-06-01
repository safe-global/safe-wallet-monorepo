import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { Signer } from '@/src/store/signersSlice'

/**
 * Pure collision-check primitive. Returns the existing signer at the given
 * address if its type differs from `newType`, otherwise null.
 *
 * Used by useSignerCollisionGuard (production) and the e2e WalletConnect
 * mock so both share one implementation. Drift becomes a TypeScript error
 * if the Signer union changes.
 */
export const findCollidingSigner = (
  signers: Record<string, Signer>,
  address: string,
  newType: Signer['type'],
): Signer | null => {
  const existing = Object.values(signers).find((s) => sameAddress(s.value, address))
  if (!existing || existing.type === newType) {
    return null
  }
  return existing
}
