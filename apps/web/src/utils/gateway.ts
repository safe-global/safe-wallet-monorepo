import type { JsonRpcSigner } from 'ethers'
import { deleteTransaction } from '@safe-global/safe-gateway-typescript-sdk'
import { signTxServiceMessage } from '@safe-global/utils/utils/gateway'

export const deleteTx = async ({
  chainId,
  safeAddress,
  safeTxHash,
  signer,
}: {
  chainId: string
  safeAddress: string
  safeTxHash: string
  signer: JsonRpcSigner
}) => {
  const signature = await signTxServiceMessage(chainId, safeAddress, safeTxHash, signer)
  return await deleteTransaction(chainId, safeTxHash, signature)
}
