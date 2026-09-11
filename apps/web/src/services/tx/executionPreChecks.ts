/**
 * Pre-broadcast checks for the three causes hidden behind the GS026 on-chain
 * revert ("Invalid owner provided"): a stale nonce, a non-signer executor, and
 * a signature that does not verify. Each is detectable client-side, so we block
 * submission with a specific message instead of letting the transaction revert
 * on-chain and cost the user gas (WA-3005).
 */
import { ethers } from 'ethers'
import type { SafeTransaction } from '@safe-global/types-kit'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import { getGs026Message, type Gs026Reason } from '@safe-global/utils/services/exceptions/contractErrors'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { logError } from '@/services/exceptions'
import { getNonces } from '@/services/tx/tx-sender/recommendedNonce'
import { getSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { isOwner } from '@/utils/transaction-guards'

export class Gs026PreCheckError extends Error {
  /** The GS code this pre-check prevents — lets the Details panel show it. */
  code = 'GS026' as const
  reason: Gs026Reason

  constructor(reason: Gs026Reason) {
    super(getGs026Message(reason))
    this.name = 'Gs026PreCheckError'
    this.reason = reason
  }
}

export const isGs026PreCheckError = (error: unknown): error is Gs026PreCheckError => error instanceof Gs026PreCheckError

/**
 * A Safe signature's last byte is the ECDSA `v` value, which Safe overloads to
 * encode HOW the signature must be verified:
 * https://docs.safe.global/advanced/smart-account-signatures
 *
 * - 0: contract (EIP-1271) signature
 * - 1: pre-validated signature (hash approved on-chain / msg.sender)
 * - 27/28: standard ECDSA signature over the safeTxHash
 * - 31/32: eth_sign — ECDSA over the EIP-191-prefixed safeTxHash, with v shifted by +4
 */
const SIG_TYPE_CONTRACT = 0
const SIG_TYPE_PRE_VALIDATED = 1
const SIG_TYPE_ECDSA = [27, 28]
const SIG_TYPE_ETH_SIGN = [31, 32]
const ETH_SIGN_V_OFFSET = 4

const getSignatureType = (staticPart: string): number => parseInt(staticPart.slice(-2), 16)

/**
 * Locally recover every collected ECDSA/eth_sign signature against the
 * transaction hash. Contract (EIP-1271) and pre-validated signatures are
 * skipped — they cannot be verified client-side. Returns the user-facing
 * message when a signature does not verify, undefined when all pass.
 */
export const validateTxSignatures = (safeTx: SafeTransaction, safeTxHash: string): string | undefined => {
  for (const signature of safeTx.signatures.values()) {
    if (signature.isContractSignature) {
      continue
    }

    const sig = signature.staticPart()
    const signatureType = getSignatureType(sig)

    if (signatureType === SIG_TYPE_CONTRACT || signatureType === SIG_TYPE_PRE_VALIDATED) {
      // Verified on-chain only; nothing to recover locally
      continue
    }

    if (SIG_TYPE_ECDSA.includes(signatureType)) {
      try {
        const recoveredAddress = ethers.recoverAddress(safeTxHash, sig)
        if (recoveredAddress !== signature.signer) {
          return getGs026Message('BAD_SIGNATURE')
        }
      } catch (e) {
        logError(ErrorCodes._818, e)
        return getGs026Message('BAD_SIGNATURE')
      }
    }

    if (SIG_TYPE_ETH_SIGN.includes(signatureType)) {
      try {
        // Undo Safe's +4 offset to get a standard v, then verify as an
        // EIP-191 personal_sign message over the safeTxHash
        const standardV = signatureType - ETH_SIGN_V_OFFSET
        const standardSig = `${sig.slice(0, -2)}${standardV.toString(16)}`
        const recoveredAddress = ethers.verifyMessage(ethers.getBytes(safeTxHash), standardSig)
        if (recoveredAddress !== signature.signer) {
          return getGs026Message('BAD_SIGNATURE')
        }
      } catch (e) {
        logError(ErrorCodes._818, e)
        return getGs026Message('BAD_SIGNATURE')
      }
    }
  }
}

/**
 * Run all GS026 pre-checks before broadcasting an execution. Throws a
 * `Gs026PreCheckError` carrying the cause-specific message on the first
 * failed check. Checks are best-effort: when the data needed for a check is
 * unavailable (nonce fetch failed, SDK not initialised) the check is skipped
 * rather than blocking a potentially valid transaction — the on-chain
 * validation remains the final safety net.
 */
export const runExecutionPreChecks = async ({
  safeTx,
  safe,
  signerAddress,
}: {
  safeTx: SafeTransaction
  safe: Pick<ExtendedSafeInfo, 'chainId' | 'address' | 'owners' | 'threshold' | 'deployed'>
  signerAddress: string
}): Promise<void> => {
  // STALE_NONCE: another transaction already consumed this nonce
  if (safe.deployed) {
    const nonces = await getNonces(safe.chainId, safe.address.value)
    if (nonces && safeTx.data.nonce < nonces.currentNonce) {
      throw new Gs026PreCheckError('STALE_NONCE')
    }
  }

  // NOT_SIGNER: an under-signed transaction counts the executor's own
  // pre-validated signature, so the executor must be an owner
  if (safeTx.signatures.size < safe.threshold && !isOwner(safe.owners, signerAddress)) {
    throw new Gs026PreCheckError('NOT_SIGNER')
  }

  // BAD_SIGNATURE: a collected signature does not recover to its claimed signer
  const sdk = getSafeSDK()
  if (sdk) {
    const safeTxHash = await sdk.getTransactionHash(safeTx)
    if (validateTxSignatures(safeTx, safeTxHash)) {
      throw new Gs026PreCheckError('BAD_SIGNATURE')
    }
  }
}
