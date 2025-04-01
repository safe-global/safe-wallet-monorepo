import type { JsonRpcSigner } from 'ethers'
import { deleteTransaction } from '@safe-global/safe-gateway-typescript-sdk'
import { signTypedData } from './web3'

export const signTxServiceMessage = async (
  chainId: string,
  safeAddress: string,
  safeTxHash: string,
  signer: JsonRpcSigner,
): Promise<string> => {
  return await signTypedData(signer, {
    types: {
      DeleteRequest: [
        { name: 'safeTxHash', type: 'bytes32' },
        { name: 'totp', type: 'uint256' },
      ],
    },
    domain: {
      name: 'Safe Transaction Service',
      version: '1.0',
      chainId,
      verifyingContract: safeAddress,
    },
    message: {
      safeTxHash,
      totp: Math.floor(Date.now() / 3600e3),
    },
  })
}

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
