import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { fetchTransactionDetails } from '@/src/services/tx/fetchTransactionDetails'
import extractTxInfo from '@/src/services/tx/extractTx'
import { createConnectedWallet } from '../../web3'
import { SafeInfo } from '@/src/types/address'
import type { SafeTransaction, SafeTransactionDataPartial } from '@safe-global/types-kit'
import { getSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

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
    safeTx.addSignature({
      signer,
      data,
      staticPart: () => data,
      dynamicPart: () => '',
      isContractSignature: false,
    })
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
