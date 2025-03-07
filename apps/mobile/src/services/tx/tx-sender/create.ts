import type { ChainInfo, TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'

import { getTransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import extractTxInfo from '@/src/services/tx/extractTx'
import { createConnectedWallet } from '../../web3'
import { SafeInfo } from '@/src/types/address'

interface CreateTxParams {
  activeSafe: SafeInfo
  txId: string
  privateKey: string
  txDetails?: TransactionDetails
  chain: ChainInfo
}

export const createExistingTx = async ({ activeSafe, txId, privateKey, txDetails, chain }: CreateTxParams) => {
  // Get the tx details from the backend if not provided
  txDetails = txDetails || (await getTransactionDetails(activeSafe.chainId, txId))

  const { txParams, signatures } = extractTxInfo(txDetails, activeSafe.address)

  const { protocolKit } = await createConnectedWallet(privateKey, activeSafe, chain)

  const safeTx = await protocolKit.createTransaction({ transactions: [txParams] }).catch(console.log)

  return { safeTx, signatures }
}
