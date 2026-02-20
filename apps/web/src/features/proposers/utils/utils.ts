import { hashTypedData, signTypedData } from '@safe-global/utils/utils/web3'
import { SigningMethod, EthSafeSignature, buildContractSignature, buildSignatureBytes } from '@safe-global/protocol-kit'
import { adjustVInSignature } from '@safe-global/protocol-kit/dist/src/utils/signatures'
import type { JsonRpcSigner } from 'ethers'
import { getDelegateTypedData } from '@safe-global/utils/services/delegates'
import { TOTP_INTERVAL_SECONDS } from '@/features/proposers/constants'

export const signProposerTypedData = async (chainId: string, proposerAddress: string, signer: JsonRpcSigner) => {
  const typedData = getDelegateTypedData(chainId, proposerAddress)
  return signTypedData(signer, typedData)
}

/**
 * Signs the delegate typed data as a Safe message for EIP-1271 validation.
 *
 * When the parent Safe's isValidSignature is called with the delegate hash,
 * the CompatibilityFallbackHandler wraps it in a SafeMessage EIP-712 structure:
 *   domain: { verifyingContract: parentSafeAddress, chainId }
 *   types: { SafeMessage: [{ type: 'bytes', name: 'message' }] }
 *   message: { message: delegateTypedDataHash }
 *
 * The EOA owner must sign this wrapped typed data so that checkSignatures
 * can recover the signer correctly.
 */
export const signProposerTypedDataForSafe = async (
  chainId: string,
  proposerAddress: string,
  parentSafeAddress: string,
  signer: JsonRpcSigner,
) => {
  // Step 1: Compute the delegate typed data hash
  const delegateTypedData = getDelegateTypedData(chainId, proposerAddress)
  const delegateHash = hashTypedData(delegateTypedData)

  // Step 2: Build the SafeMessage typed data that the CompatibilityFallbackHandler uses
  const safeMessageTypedData = {
    domain: {
      verifyingContract: parentSafeAddress,
      chainId: Number(chainId),
    },
    types: {
      SafeMessage: [{ type: 'bytes', name: 'message' }],
    },
    message: {
      message: delegateHash,
    },
    primaryType: 'SafeMessage' as const,
  }

  // Step 3: Sign the SafeMessage typed data with the EOA
  return signTypedData(signer, safeMessageTypedData)
}

const getProposerDataV1 = (proposerAddress: string) => {
  const totp = Math.floor(Date.now() / 1000 / TOTP_INTERVAL_SECONDS)

  return `${proposerAddress}${totp}`
}

export const signProposerData = async (proposerAddress: string, signer: JsonRpcSigner) => {
  const data = getProposerDataV1(proposerAddress)

  const signature = await signer.signMessage(data)

  return adjustVInSignature(SigningMethod.ETH_SIGN_TYPED_DATA, signature)
}

/**
 * Encodes an EOA signature in EIP-1271 contract signature format for a parent Safe.
 *
 * Uses Safe Protocol Kit's buildContractSignature to create the proper format:
 * - bytes 0-31:  r = parentSafeAddress (left-padded to 32 bytes)
 * - bytes 32-63: s = offset to dynamic signature data
 * - byte 64:     v = 0x00 (contract signature type)
 * - bytes 65+:   length-prefixed owner signature(s)
 */
export const encodeEIP1271Signature = async (parentSafeAddress: string, ownerSignature: string): Promise<string> => {
  // Create a SafeSignature object from the raw owner signature
  const ownerSig = new EthSafeSignature(parentSafeAddress, ownerSignature, false)

  // Build the contract signature wrapper for EIP-1271 validation
  const contractSig = await buildContractSignature([ownerSig], parentSafeAddress)

  // Encode to the final signature bytes string
  return '0x' + buildSignatureBytes([contractSig]).slice(2)
}
