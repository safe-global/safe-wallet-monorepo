import { sameAddress } from '@safe-global/utils/utils/addresses'
import { getContractErrorMessage, getGs026Message } from '@safe-global/utils/services/exceptions/contractErrors'
import { ExecutionError } from './executionErrors'

export interface MissingSignaturesCheckParams {
  /**
   * Signers that have already confirmed the transaction (CGW confirmations).
   * `undefined` means the caller could not determine them — the check is
   * skipped rather than treating unknown as none.
   */
  confirmedSigners: string[] | undefined
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
 * Fails open: returns `undefined` whenever the inputs are unknown (Safe info
 * still loading, confirmations not resolved). Blocking a valid execution is a
 * worse outcome than letting the on-chain check have the final say, and the
 * confirmations we read may in any case be a moment behind a confirmation
 * landing on another device.
 */
export const getMissingSignaturesError = ({
  confirmedSigners,
  threshold,
  owners,
  executorAddress,
}: MissingSignaturesCheckParams): ExecutionError | undefined => {
  if (!threshold || threshold <= 0 || !confirmedSigners) {
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
    return new ExecutionError(getGs026Message('NOT_SIGNER'), { code: 'GS026' })
  }

  // GS025: the transaction is simply short of confirmations.
  return new ExecutionError(getContractErrorMessage('GS025'), { code: 'GS025' })
}
