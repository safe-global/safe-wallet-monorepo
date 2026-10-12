import { signTypedData } from '@safe-global/utils/utils/web3'
import { EthSafeSignature, buildContractSignature, buildSignatureBytes } from '@safe-global/protocol-kit'
import { SigningMethod } from '@safe-global/types-kit'
import { adjustVInSignature } from '@safe-global/protocol-kit'
import { getBytes, isError } from 'ethers'
import type { JsonRpcProvider, JsonRpcSigner } from 'ethers'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import {
  getDelegateTypedData,
  hashDelegateTypedData,
  isQueueServiceDelegateTypedData,
} from '@safe-global/utils/services/delegates'
import type { DelegateAction, DelegateTypedData } from '@safe-global/utils/services/delegates'
import { TOTP_INTERVAL_SECONDS } from '@/features/proposers/constants'
import { isEthSignWallet, isSmartContractWallet } from '@/utils/wallets'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'

type DelegateChain = Pick<Chain, 'chainId' | 'features'>

// The queue service domain has a non-standard `safe` field that ethers' signTypedData rejects, so it goes to the wallet as raw eth_signTypedData_v4.
const signDelegateTypedData = async (signer: JsonRpcSigner, typedData: DelegateTypedData): Promise<string> => {
  if (!isQueueServiceDelegateTypedData(typedData)) {
    return signTypedData(signer, typedData)
  }

  const address = signer.address.toLowerCase()
  let signature: string
  try {
    signature = await signer.provider.send('eth_signTypedData_v4', [address, JSON.stringify(typedData)])
  } catch (error) {
    // Same Ledger fallback as the shared signTypedData helper
    if (!isError(error, 'UNSUPPORTED_OPERATION')) throw error
    signature = await signer.provider.send('eth_signTypedData', [address, typedData])
  }
  return adjustVInSignature(SigningMethod.ETH_SIGN_TYPED_DATA, signature)
}

// v1 only writes to the transaction service, so eth_sign wallets use it only on chains without QUEUE_SERVICE; the queue service (v3) accepts their eth_sign signature directly.
export const usesV1DelegateEndpoint = (chain: DelegateChain, wallet: ConnectedWallet) =>
  isEthSignWallet(wallet) && !hasFeature(chain, FEATURES.QUEUE_SERVICE)

const signProposerTypedData = async (
  chain: DelegateChain,
  proposerAddress: string,
  safeAddress: string,
  action: DelegateAction,
  signer: JsonRpcSigner,
) => {
  const typedData = getDelegateTypedData(chain, proposerAddress, safeAddress, action)
  return signDelegateTypedData(signer, typedData)
}

// For wallets that cannot sign typed data: eth_sign over the delegate EIP-712 hash, v shifted by 4 as for Safe eth_sign signatures.
const ethSignProposerTypedDataHash = async (
  chain: DelegateChain,
  proposerAddress: string,
  safeAddress: string,
  action: DelegateAction,
  signer: JsonRpcSigner,
) => {
  const hash = hashDelegateTypedData(getDelegateTypedData(chain, proposerAddress, safeAddress, action))
  const signature = await signer.signMessage(getBytes(hash))
  return adjustVInSignature(SigningMethod.ETH_SIGN, signature, hash, signer.address)
}

const getProposerDataV1 = (proposerAddress: string) => {
  const totp = Math.floor(Date.now() / 1000 / TOTP_INTERVAL_SECONDS)

  return `${proposerAddress}${totp}`
}

const signProposerData = async (proposerAddress: string, signer: JsonRpcSigner) => {
  const data = getProposerDataV1(proposerAddress)

  const signature = await signer.signMessage(data)

  return adjustVInSignature(SigningMethod.ETH_SIGN_TYPED_DATA, signature)
}

type ProposerDelegation = {
  chain: DelegateChain
  wallet: ConnectedWallet
  proposerAddress: string
  safeAddress: string
  action: DelegateAction
  signer: JsonRpcSigner
}

/** The v1 message on transaction-service chains for eth_sign wallets, eth_sign over the delegate hash on queue-service chains, typed data otherwise. */
export const signProposerDelegation = ({
  chain,
  wallet,
  proposerAddress,
  safeAddress,
  action,
  signer,
}: ProposerDelegation): Promise<string> => {
  if (usesV1DelegateEndpoint(chain, wallet)) return signProposerData(proposerAddress, signer)
  if (isEthSignWallet(wallet)) return ethSignProposerTypedDataHash(chain, proposerAddress, safeAddress, action, signer)
  return signProposerTypedData(chain, proposerAddress, safeAddress, action, signer)
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
  chain: DelegateChain,
  proposerAddress: string,
  parentSafeAddress: string,
  safeAddress: string,
  action: DelegateAction,
  signer: JsonRpcSigner,
) => {
  // Step 1: Compute the delegate typed data hash
  const delegateTypedData = getDelegateTypedData(chain, proposerAddress, safeAddress, action)
  const delegateHash = hashDelegateTypedData(delegateTypedData)

  // Step 2: Build the SafeMessage typed data that the CompatibilityFallbackHandler uses
  const safeMessageTypedData = {
    domain: {
      verifyingContract: parentSafeAddress,
      chainId: Number(chain.chainId),
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

/**
 * Address validator that rejects deployed smart contracts (EIP-7702 delegated EOAs are allowed).
 * Fails open: returns undefined when the check cannot be performed, e.g. no RPC provider.
 */
export const addressIsNotSmartContract =
  (chainId: string, message: string, provider?: JsonRpcProvider) =>
  async (address: string): Promise<string | undefined> => {
    try {
      return (await isSmartContractWallet(chainId, address, provider)) ? message : undefined
    } catch {
      return undefined
    }
  }
