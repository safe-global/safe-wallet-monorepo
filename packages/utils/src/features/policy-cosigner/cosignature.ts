import { Interface, ZeroAddress, dataLength, isError, recoverAddress } from 'ethers'
import type { CosignatureDto, CosignerTransactionResult } from '@safe-global/store/cosigner/cosignerApi.dto'
import { ERC1271_ABI, ERC1271_MAGIC_VALUE } from './constants'
import { UnsupportedCosignatureError, toPolicyContext } from './policyContext'
import type { EthCall } from './requirement'

export type CosignatureOutcome =
  | { status: 'notFound' }
  | { status: 'pending' }
  | { status: 'ready'; context: string; onchain: boolean; signer: string; cosignerName: CosignatureDto['cosignerName'] }
  | { status: 'rejected'; reason: string | null; ruleId: string | null; cosignerName: CosignatureDto['cosignerName'] }
  | { status: 'failed'; reason: string | null; cosignerName: CosignatureDto['cosignerName'] }
  | { status: 'invalid'; reason: string }

type SafeTxGasFields = {
  safeTxGas: string | number
  baseGas: string | number
  gasPrice: string | number
  gasToken: string
  refundReceiver: string
}

const erc1271Interface = new Interface(ERC1271_ABI)

const isSameAddress = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase()

/** CoSignerPolicy rebuilds the hash with every gas field zeroed, so only such a tx can be co-signed */
export const hasZeroGasFields = (tx: SafeTxGasFields): boolean =>
  BigInt(tx.safeTxGas) === 0n &&
  BigInt(tx.baseGas) === 0n &&
  BigInt(tx.gasPrice) === 0n &&
  isSameAddress(tx.gasToken, ZeroAddress) &&
  isSameAddress(tx.refundReceiver, ZeroAddress)

/**
 * Picks the co-signature for the on-chain co-signer. A signature that could still arrive wins over
 * a final rejection, since the service may run co-signers that aren't the one this Safe configured.
 */
export const evaluateCosignatures = (
  result: CosignerTransactionResult | undefined,
  cosigner: string,
): CosignatureOutcome => {
  if (!result || 'notFound' in result) {
    return { status: 'notFound' }
  }

  const { signatures } = result
  const signed = signatures.find(
    (entry) => entry.status === 'SIGNED' && entry.signature && isSameAddress(entry.signature.signer, cosigner),
  )

  if (signed?.signature) {
    try {
      const { context, onchain } = toPolicyContext(signed.signature.data)
      return { status: 'ready', context, onchain, signer: signed.signature.signer, cosignerName: signed.cosignerName }
    } catch (error) {
      if (error instanceof UnsupportedCosignatureError) {
        return { status: 'invalid', reason: error.message }
      }
      throw error
    }
  }

  if (signatures.length === 0 || signatures.some((entry) => entry.status === 'PENDING')) {
    return { status: 'pending' }
  }

  const rejected = signatures.find((entry) => entry.status === 'REJECTED')
  if (rejected) {
    return { status: 'rejected', reason: rejected.reason, ruleId: rejected.ruleId, cosignerName: rejected.cosignerName }
  }

  const failed = signatures.find((entry) => entry.status === 'FAILED')
  if (failed) {
    return { status: 'failed', reason: failed.reason, cosignerName: failed.cosignerName }
  }

  return { status: 'invalid', reason: 'The co-signature is not from the co-signer configured for this Safe' }
}

/** Mirrors OpenZeppelin `SignatureChecker.isValidSignatureNow`: ECDSA recovery first, then ERC-1271 */
export const isValidCosignature = async (
  call: EthCall,
  cosigner: string,
  safeTxHash: string,
  context: string,
): Promise<boolean> => {
  if (dataLength(context) === 65) {
    try {
      if (isSameAddress(recoverAddress(safeTxHash, context), cosigner)) {
        return true
      }
    } catch {
      // Not a recoverable ECDSA signature, so only ERC-1271 can accept it
    }
  }

  try {
    const result = await call({
      to: cosigner,
      data: erc1271Interface.encodeFunctionData('isValidSignature', [safeTxHash, context]),
    })
    const [magicValue] = erc1271Interface.decodeFunctionResult('isValidSignature', result)
    return magicValue === ERC1271_MAGIC_VALUE
  } catch (error) {
    if (isError(error, 'CALL_EXCEPTION') || isError(error, 'BAD_DATA')) {
      return false
    }
    throw error
  }
}
