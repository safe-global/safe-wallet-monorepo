import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import { getTransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeTransaction, SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types'
import extractTxInfo from '../extractTx'

/**
 * Create a transaction from raw params
//  */
// export const createTx = async (txParams: SafeTransactionDataPartial, nonce?: number): Promise<SafeTransaction> => {
//   if (nonce !== undefined) {
//     txParams = { ...txParams, nonce }
//   }
//   const safeSDK = getAndValidateSafeSDK()
//   return safeSDK.createTransaction({ transactions: [txParams] })
// }

// export const createExistingTx = async (
//   chainId: string,
//   safeAddress: string,
//   txId: string,
//   txDetails?: TransactionDetails,
// ): Promise<SafeTransaction> => {
//   // Get the tx details from the backend if not provided
//   txDetails = txDetails || (await getTransactionDetails(chainId, txId))

//   // Convert them to the Core SDK tx params
//   const { txParams, signatures } = extractTxInfo(txDetails, safeAddress)

//   // Create a tx and add pre-approved signatures
//   const safeTx = await createTx(txParams, txParams.nonce)
//   Object.entries(signatures).forEach(([signer, data]) => {
//     safeTx.addSignature({
//       signer,
//       data,
//       staticPart: () => data,
//       dynamicPart: () => '',
//       isContractSignature: false,
//     })
//   })

//   return safeTx
// }
