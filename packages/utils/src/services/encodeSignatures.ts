import type { SafeTransaction } from '@safe-global/types-kit'
import { generatePreValidatedSignature } from '@safe-global/protocol-kit/dist/src/utils/signatures'

export const encodeSignatures = (
  safeTx: SafeTransaction,
  from: string | undefined,
  needsSignature: boolean,
): string => {
  const owner = from?.toLowerCase()
  const needsOwnerSig = needsSignature && owner !== undefined && !safeTx.signatures.has(owner)

  // https://docs.gnosis.io/safe/docs/contracts_signatures/#pre-validated-signatures
  if (needsOwnerSig) {
    const ownerSig = generatePreValidatedSignature(owner)
    safeTx.addSignature(ownerSig)
  }

  const encoded = safeTx.encodedSignatures()

  // Remove the "fake" signature we've just added
  if (needsOwnerSig) {
    safeTx.signatures.delete(owner)
  }

  return encoded
}
