import type {
  MultisigExecutionDetails,
  TransactionDetails,
  TransactionPreview,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { SafeTransactionDataPartial } from '@safe-global/types-kit'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const zeroAddressInfo = (): AddressInfo => ({
  value: ZERO_ADDRESS,
  name: null,
  logoUri: null,
})

interface SynthesizeInput {
  safeAddress: string
  safeTxHash: string
  buildParams: SafeTransactionDataPartial
  owners: AddressInfo[]
  threshold: number
  preview: TransactionPreview
}

/**
 * Builds a TransactionDetails-shaped object from a locally composed
 * transaction so the existing CGW-driven viewing screens can render
 * the draft without any branching.
 *
 * The synthetic `detailedExecutionInfo` lists every owner as a
 * "missing signer" with zero confirmations — exactly what an
 * unproposed tx looks like. The proposer is intentionally null: it's
 * resolved at sign time from the active signer, not at compose time.
 */
export const synthesizeDraftTxDetails = ({
  safeAddress,
  safeTxHash,
  buildParams,
  owners,
  threshold,
  preview,
}: SynthesizeInput): TransactionDetails => {
  const detailedExecutionInfo: MultisigExecutionDetails = {
    type: 'MULTISIG',
    submittedAt: Date.now(),
    nonce: typeof buildParams.nonce === 'number' ? buildParams.nonce : Number(buildParams.nonce ?? 0),
    safeTxGas: buildParams.safeTxGas?.toString() ?? '0',
    baseGas: buildParams.baseGas?.toString() ?? '0',
    gasPrice: buildParams.gasPrice?.toString() ?? '0',
    gasToken: buildParams.gasToken ?? ZERO_ADDRESS,
    fee: '0',
    payment: '0',
    refundReceiver: buildParams.refundReceiver
      ? { value: buildParams.refundReceiver, name: null, logoUri: null }
      : zeroAddressInfo(),
    safeTxHash,
    executor: null,
    signers: owners,
    confirmationsRequired: threshold,
    confirmations: [],
    rejectors: [],
    // `trusted` is a CGW server signal that the transaction has been
    // validated by their pipeline. A locally-synthesized draft has not
    // — flip it to false so any future consumer that gates security UI
    // on this flag (e.g. shield/risk badges) treats drafts cautiously.
    trusted: false,
    proposer: null,
    proposedByDelegate: null,
  }

  // For 1-of-N Safes the very first signature also executes the tx, so
  // a freshly composed draft conceptually skips the confirmation gate.
  // For multisig, signatures still need to be collected from cosigners.
  const txStatus: TransactionDetails['txStatus'] = threshold === 1 ? 'AWAITING_EXECUTION' : 'AWAITING_CONFIRMATIONS'

  return {
    safeAddress,
    txId: safeTxHash,
    txStatus,
    txInfo: preview.txInfo,
    txData: preview.txData,
    detailedExecutionInfo,
    txHash: null,
    safeAppInfo: null,
    note: null,
    executedAt: null,
  }
}
