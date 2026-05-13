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
  sender?: string
}

/**
 * Builds a TransactionDetails-shaped object from a locally composed
 * transaction so the existing CGW-driven viewing screens can render
 * the draft without any branching.
 *
 * The synthetic `detailedExecutionInfo` lists every owner as a
 * "missing signer" with zero confirmations — exactly what an
 * unproposed tx looks like.
 */
export const synthesizeDraftTxDetails = ({
  safeAddress,
  safeTxHash,
  buildParams,
  owners,
  threshold,
  preview,
  sender,
}: SynthesizeInput): TransactionDetails => {
  const senderInfo: AddressInfo | undefined = sender
    ? (owners.find((owner) => owner.value.toLowerCase() === sender.toLowerCase()) ?? {
        value: sender,
        name: null,
        logoUri: null,
      })
    : undefined

  const detailedExecutionInfo: MultisigExecutionDetails = {
    type: 'MULTISIG',
    submittedAt: Date.now(),
    nonce: typeof buildParams.nonce === 'number' ? buildParams.nonce : Number(buildParams.nonce ?? 0),
    safeTxGas: buildParams.safeTxGas?.toString() ?? '0',
    baseGas: buildParams.baseGas?.toString() ?? '0',
    gasPrice: buildParams.gasPrice?.toString() ?? '0',
    gasToken: buildParams.gasToken ?? ZERO_ADDRESS,
    refundReceiver: buildParams.refundReceiver
      ? { value: buildParams.refundReceiver, name: null, logoUri: null }
      : zeroAddressInfo(),
    safeTxHash,
    executor: null,
    signers: owners,
    confirmationsRequired: threshold,
    confirmations: [],
    rejectors: [],
    trusted: true,
    proposer: senderInfo ?? null,
    proposedByDelegate: null,
  }

  return {
    safeAddress,
    txId: safeTxHash,
    txStatus: 'AWAITING_CONFIRMATIONS',
    txInfo: preview.txInfo,
    txData: preview.txData,
    detailedExecutionInfo,
    txHash: null,
    safeAppInfo: null,
    note: null,
    executedAt: null,
  }
}
