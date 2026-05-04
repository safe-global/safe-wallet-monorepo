import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { fetchTransactionDetails } from '@/src/services/tx/fetchTransactionDetails'
import extractTxInfo from '@/src/services/tx/extractTx'
import { createConnectedWallet } from '../../web3'
import { SafeInfo } from '@/src/types/address'
import type { SafeTransaction, SafeTransactionDataPartial } from '@safe-global/types-kit'
import { getSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { EthSafeSignature } from '@safe-global/protocol-kit'

interface CreateTxParams {
  activeSafe: SafeInfo
  txId: string
  privateKey: string
  txDetails?: TransactionDetails
  chain: Chain
}

export const createTx = async (txParams: SafeTransactionDataPartial, nonce?: number): Promise<SafeTransaction> => {
  const safeSDK = getSafeSDK()
  if (!safeSDK) {
    console.log('failed to init sdk')
    throw new Error(
      'The Safe SDK could not be initialized. Please be aware that we only support v1.0.0 Safe Accounts and up.',
    )
  }
  if (nonce !== undefined) {
    txParams = { ...txParams, nonce }
  }
  if (Number.isNaN(txParams.safeTxGas) || txParams.safeTxGas === 'NaN') {
    txParams = { ...txParams, safeTxGas: '0' }
  }
  return safeSDK.createTransaction({ transactions: [txParams] })
}

/**
 * Add signatures to a Safe transaction
 * @param safeTx The Safe transaction to add signatures to
 * @param signatures Record of signer addresses to signature data
 */
export const addSignaturesToTx = (safeTx: SafeTransaction, signatures: Record<string, string>): void => {
  Object.entries(signatures).forEach(([signer, data]) => {
    // Contract signatures (ERC-1271, e.g. passkey signers) are stored in CGW
    // as the full encoded form from encodedSignatures(). This includes:
    //   {32-byte padded signer}{32-byte dynamic offset}{1-byte v=0x00}
    //   {32-byte data length}{inner signature data}
    // We need to extract the inner signature data so buildSignatureBytes
    // can recalculate the dynamic offset when combining multiple signatures.
    //
    // Standard EOA signatures are exactly 65 bytes (132 hex chars with 0x).
    const isContractSig = data.length > 132

    if (isContractSig) {
      // Extract the inner signature data from the full encoded form.
      // The stored format from encodedSignatures() for a single contract sig:
      //   0x + 64 chars (32-byte padded signer) + 64 chars (32-byte offset) + 2 chars (v=0x00)
      //   = 130 hex chars of static part (65 bytes)
      //   Then: 64 chars (32-byte data length) + actual inner data
      // EthSafeSignature.dynamicPart() will re-prepend the length, so we
      // skip the static part (130 chars) + length (64 chars).
      const innerDataStart = 2 + 64 + 64 + 2 + 64 // = 196
      const innerData = '0x' + data.slice(innerDataStart)
      safeTx.addSignature(new EthSafeSignature(signer, innerData, true))
    } else {
      safeTx.addSignature(new EthSafeSignature(signer, data, false))
    }
  })
}

export const createExistingTx = async (
  txParams: SafeTransactionDataPartial,
  signatures: Record<string, string>,
): Promise<SafeTransaction> => {
  const safeTx = await createTx(txParams, txParams.nonce)
  addSignaturesToTx(safeTx, signatures)
  return safeTx
}

export const proposeTx = async ({ activeSafe, txId, privateKey, txDetails, chain }: CreateTxParams) => {
  if (!txDetails) {
    txDetails = await fetchTransactionDetails(activeSafe.chainId, txId)
  }

  const { txParams, signatures } = extractTxInfo(txDetails, activeSafe.address)

  const { protocolKit } = await createConnectedWallet(privateKey, activeSafe, chain)

  const safeTx = await protocolKit.createTransaction({ transactions: [txParams] }).catch(console.log)

  return { safeTx, signatures }
}
