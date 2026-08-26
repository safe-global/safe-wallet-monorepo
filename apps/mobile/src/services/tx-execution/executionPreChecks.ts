import { sameAddress } from '@safe-global/utils/utils/addresses'
import { getContractErrorMessage, getGs026Message } from '@safe-global/utils/services/exceptions/contractErrors'
import { ExecutionError } from './executionErrors'

export interface MissingSignaturesCheckParams {
  /** Signers that have already confirmed the transaction (CGW confirmations). */
  confirmedSigners: string[]
  /** Signatures the Safe Account requires, i.e. its threshold. */
  threshold: number | undefined
  /** Current signers of the Safe Account. */
  owners: string[]
  /**
   * Address that will send `execTransaction`. `undefined` when a relayer sends
   * it, since a relayer can never contribute a pre-validated signature.
   */
  executorAddress: string | undefined
}

/**
 * Block an execution that cannot possibly satisfy the Safe's threshold, before
 * anything is broadcast and before any gas is spent.
 *
 * An executor that is a signer contributes a pre-validated signature of its
 * own, so it covers exactly one of the missing confirmations — unless it has
 * already confirmed, in which case that signature is counted twice.
 *
 * Returns `undefined` when the transaction can be executed, or when the Safe
 * info has not loaded yet (a missing threshold must not block a valid
 * execution — the on-chain check stays the final safety net).
 */
export const getMissingSignaturesError = ({
  confirmedSigners,
  threshold,
  owners,
  executorAddress,
}: MissingSignaturesCheckParams): ExecutionError | undefined => {
  if (!threshold || threshold <= 0) {
    return undefined
  }

  const executorIsOwner = owners.some((owner) => sameAddress(owner, executorAddress))
  const executorHasConfirmed = confirmedSigners.some((signer) => sameAddress(signer, executorAddress))
  const preValidatedSignature = executorIsOwner && !executorHasConfirmed ? 1 : 0

  if (confirmedSigners.length + preValidatedSignature >= threshold) {
    return undefined
  }

  // A wallet that is not a signer cannot make up the difference — the on-chain
  // failure would be GS026 ("invalid owner provided").
  if (executorAddress && !executorIsOwner) {
    return new ExecutionError(getGs026Message('NOT_SIGNER'))
  }

  // GS025: the transaction is simply short of confirmations.
  return new ExecutionError(getContractErrorMessage('GS025'))
}
