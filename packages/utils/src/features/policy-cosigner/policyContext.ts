import { concat, dataLength, dataSlice, getBytes, toBeHex, zeroPadValue } from 'ethers'
import type { SafeTransaction } from '@safe-global/types-kit'
import { POLICY_CONTEXT_TYPE_HASH } from './constants'

export class UnsupportedCosignatureError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnsupportedCosignatureError'
  }
}

export type PolicyContext = {
  /** Bytes CoSignerPolicy receives as `context`; empty when the co-signer approved on-chain */
  context: string
  /** The co-signer approved the hash on-chain (Safe signature `v = 1`) */
  onchain: boolean
}

const ECDSA_SIGNATURE_LENGTH = 65

/**
 * Appends a `SignatureExtension` envelope after the owner signatures:
 * `[signatures][context][uint256 contextLength][bytes32 typeHash]`.
 * An empty context needs no envelope: the guard reads a missing one as empty.
 */
export const appendPolicyContext = (signatures: string, context: string): string => {
  const length = dataLength(context)
  if (length === 0) {
    return signatures
  }
  return concat([signatures, context, zeroPadValue(toBeHex(length), 32), POLICY_CONTEXT_TYPE_HASH])
}

/**
 * A view of `safeTx` whose encoded signatures carry the policy context. It shares the signature map,
 * so code that adds and removes a pre-validated signature on it still sees the original tx.
 * Code that copies the tx (protocol-kit `executeTransaction`) drops the override.
 */
export const withPolicyContext = (safeTx: SafeTransaction, context: string | undefined): SafeTransaction => {
  if (!context || dataLength(context) === 0) {
    return safeTx
  }
  return {
    data: safeTx.data,
    signatures: safeTx.signatures,
    getSignature: (signer) => safeTx.getSignature(signer),
    addSignature: (signature) => safeTx.addSignature(signature),
    encodedSignatures: () => appendPolicyContext(safeTx.encodedSignatures(), context),
  }
}

/**
 * Converts a co-signature in Safe signature encoding into the context CoSignerPolicy verifies.
 * CoSignerPolicy calls `SignatureChecker.isValidSignatureNow(cosigner, hash, context)`, so the Safe
 * encoding cannot be forwarded verbatim for anything but a plain ECDSA signature.
 */
export const toPolicyContext = (signatureData: string): PolicyContext => {
  const length = dataLength(signatureData)
  if (length < ECDSA_SIGNATURE_LENGTH) {
    throw new UnsupportedCosignatureError(`Co-signature is ${length} bytes, expected at least 65`)
  }

  const v = getBytes(signatureData)[64]

  if (v === 27 || v === 28) {
    if (length !== ECDSA_SIGNATURE_LENGTH) {
      throw new UnsupportedCosignatureError('ECDSA co-signature must be exactly 65 bytes')
    }
    return { context: signatureData, onchain: false }
  }

  // ERC-1271 with an empty signature makes a Safe co-signer check its on-chain `signedMessages`
  if (v === 1) {
    return { context: '0x', onchain: true }
  }

  if (v === 0) {
    const offset = Number(BigInt(dataSlice(signatureData, 32, 64)))
    if (offset + 32 > length) {
      throw new UnsupportedCosignatureError('Contract co-signature offset is out of range')
    }
    const dynamicLength = Number(BigInt(dataSlice(signatureData, offset, offset + 32)))
    if (offset + 32 + dynamicLength > length) {
      throw new UnsupportedCosignatureError('Contract co-signature length is out of range')
    }
    return { context: dataSlice(signatureData, offset + 32, offset + 32 + dynamicLength), onchain: false }
  }

  throw new UnsupportedCosignatureError(`Co-signature type v=${v} is not accepted by the co-signer policy`)
}
