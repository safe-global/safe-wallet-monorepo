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
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import {
  getGs026BatchMessage,
  getGs026Message,
  type Gs026Reason,
} from '@safe-global/utils/services/exceptions/contractErrors'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { logError } from '@/services/exceptions'
import { getNonces } from '@/services/tx/tx-sender/recommendedNonce'
import { getSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { isMultisigDetailedExecutionInfo, isOwner } from '@/utils/transaction-guards'

export class Gs026PreCheckError extends Error {
  /** The GS code this pre-check prevents — lets the Details panel show it. */
  code = 'GS026' as const
  reason: Gs026Reason

  constructor(reason: Gs026Reason, message: string = getGs026Message(reason)) {
    super(message)
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

/** A 65-byte signature: 0x + r (32) + s (32) + v (1), hex-encoded. */
const ECDSA_SIG_LENGTH = 132

/**
 * Recover one collected signature against a hash. Returns false only on
 * positive proof that it does not verify — anything we cannot check
 * client-side (contract/EIP-1271, pre-validated, an unrecognised type) counts
 * as valid, because the on-chain validation stays the final authority and a
 * false block is worse than a missed one.
 *
 * A blob longer than 65 bytes is a contract signature carrying its dynamic
 * part, whose trailing byte is arbitrary data rather than a `v` value. Reading
 * a signature type off it would recover a random address and wrongly flag a
 * nested-Safe signer, so it is skipped. A shorter blob still goes through
 * recovery and fails there, as long as its trailing byte names a type we
 * verify; one that does not falls through to the same permissive default.
 */
const isSignatureValid = (
  { signer, staticPart, isContractSignature }: { signer: string; staticPart: string; isContractSignature?: boolean },
  hash: string,
): boolean => {
  // An on-chain approval (approveHash) is confirmed without a signature at
  // all, so there is nothing here to recover
  if (!staticPart) return true

  // Verified on-chain only; nothing to recover locally
  if (isContractSignature || staticPart.length > ECDSA_SIG_LENGTH) return true

  const signatureType = getSignatureType(staticPart)

  if (signatureType === SIG_TYPE_CONTRACT || signatureType === SIG_TYPE_PRE_VALIDATED) return true

  if (SIG_TYPE_ECDSA.includes(signatureType)) {
    try {
      return sameAddress(ethers.recoverAddress(hash, staticPart), signer)
    } catch (e) {
      logError(ErrorCodes._818, e)
      return false
    }
  }

  if (SIG_TYPE_ETH_SIGN.includes(signatureType)) {
    try {
      // Undo Safe's +4 offset to get a standard v, then verify as an
      // EIP-191 personal_sign message over the hash
      const standardV = signatureType - ETH_SIGN_V_OFFSET
      const standardSig = `${staticPart.slice(0, -2)}${standardV.toString(16)}`
      return sameAddress(ethers.verifyMessage(ethers.getBytes(hash), standardSig), signer)
    } catch (e) {
      logError(ErrorCodes._818, e)
      return false
    }
  }

  return true
}

/**
 * Locally recover every collected ECDSA/eth_sign signature against the
 * transaction hash. Contract (EIP-1271) and pre-validated signatures are
 * skipped — they cannot be verified client-side. Returns the user-facing
 * message when a signature does not verify, undefined when all pass.
 */
export const validateTxSignatures = (safeTx: SafeTransaction, safeTxHash: string): string | undefined => {
  for (const signature of safeTx.signatures.values()) {
    const valid = isSignatureValid(
      {
        signer: signature.signer,
        staticPart: signature.staticPart(),
        isContractSignature: signature.isContractSignature,
      },
      safeTxHash,
    )

    if (!valid) return getGs026Message('BAD_SIGNATURE')
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

/**
 * The bulk-execution counterpart of `runExecutionPreChecks`.
 *
 * MultiSendCallOnly does `revert(0, 0)` when an inner `execTransaction` fails,
 * so a batch that breaks on-chain gives back nothing to decode — the user pays
 * gas for an error we cannot even name (WA-3267). These checks catch the two
 * causes that are knowable client-side before anything is broadcast.
 *
 * `NOT_SIGNER` is not checked: every batched transaction is already fully
 * signed and the executor is MultiSendCallOnly, not the connected wallet.
 *
 * Signatures are verified against the `safeTxHash` the backend collected them
 * for, not a locally recomputed one. That makes the check cheap and free of SDK
 * setup, at the cost of missing a hash mismatch — a miss, never a false block,
 * which is the right side to err on when on-chain validation is the authority.
 */
export const runBatchExecutionPreChecks = async ({
  txs,
  safe,
}: {
  txs: TransactionDetails[]
  safe: Pick<ExtendedSafeInfo, 'chainId' | 'address' | 'deployed'>
}): Promise<void> => {
  const execInfos = txs.map((tx) =>
    isMultisigDetailedExecutionInfo(tx.detailedExecutionInfo) ? tx.detailedExecutionInfo : undefined,
  )

  // STALE_NONCE: the batch is signed for a fixed run of nonces starting at the
  // Safe's current one. If the queue moved since it was built — another
  // execution landed, a transaction was deleted — every hash from the break
  // onwards is wrong and the whole batch reverts.
  if (safe.deployed) {
    const nonces = await getNonces(safe.chainId, safe.address.value)

    if (nonces) {
      const staleIndex = execInfos.findIndex((info, index) => info && info.nonce !== nonces.currentNonce + index)

      if (staleIndex !== -1) {
        throw new Gs026PreCheckError('STALE_NONCE', getGs026BatchMessage('STALE_NONCE', staleIndex + 1))
      }
    }
  }

  // BAD_SIGNATURE: a collected signature no longer recovers to its signer
  execInfos.forEach((info, index) => {
    if (!info) return

    const hasInvalidSignature = info.confirmations.some(
      (confirmation) =>
        !isSignatureValid(
          { signer: confirmation.signer.value, staticPart: confirmation.signature ?? '' },
          info.safeTxHash,
        ),
    )

    if (hasInvalidSignature) {
      throw new Gs026PreCheckError('BAD_SIGNATURE', getGs026BatchMessage('BAD_SIGNATURE', index + 1))
    }
  })
}
