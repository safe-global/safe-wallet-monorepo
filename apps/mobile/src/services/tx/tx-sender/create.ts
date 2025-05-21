import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'

import { getTransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
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
  chain: ChainInfo
}

export const createTx = async (txParams: SafeTransactionDataPartial, nonce?: number): Promise<SafeTransaction> => {
  if (nonce !== undefined) {
    txParams = { ...txParams, nonce }
  }
  const safeSDK = getSafeSDK()
  if (!safeSDK) {
    console.log('failed to init sdk')
    throw new Error(
      'The Safe SDK could not be initialized. Please be aware that we only support v1.0.0 Safe Accounts and up.',
    )
  }
  return safeSDK.createTransaction({ transactions: [txParams] })
}

export const createExistingTx = async (
  txParams: SafeTransactionDataPartial,
  signatures: Record<string, string>,
): Promise<SafeTransaction> => {
  // Create a tx and add pre-approved signatures
  const safeTx = await createTx(txParams, txParams.nonce)
  Object.entries(signatures).forEach(([signer, data]) => {
    safeTx.addSignature({
      signer,
      data,
      staticPart: () => data,
      dynamicPart: () => '',
      isContractSignature: false,
    })
  })

  return safeTx
}

export const proposeTx = async ({ activeSafe, txId, privateKey, txDetails, chain }: CreateTxParams) => {
  // Get the tx details from the backend if not provided
  // TODO: fix type - we should use rtk query to get the tx details
  txDetails = txDetails || ((await getTransactionDetails(activeSafe.chainId, txId)) as TransactionDetails)

  const { txParams, signatures } = extractTxInfo(txDetails, activeSafe.address)

  const { protocolKit } = await createConnectedWallet(privateKey, activeSafe, chain)

  const safeTx = await protocolKit.createTransaction({ transactions: [txParams] }).catch(console.log)

  return { safeTx, signatures }
}
