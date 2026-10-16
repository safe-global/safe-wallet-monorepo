import type { JsonRpcSigner } from 'ethers'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { signTypedData } from '@safe-global/utils/utils/web3'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { deleteTransaction } from './transactions'

type DeleteTxChain = Pick<Chain, 'chainId' | 'features'>

export const signTxServiceMessage = async (
  chain: DeleteTxChain,
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
      name: hasFeature(chain, FEATURES.QUEUE_SERVICE) ? 'Safe Queue Service' : 'Safe Transaction Service',
      version: '1.0',
      chainId: Number(chain.chainId),
      verifyingContract: safeAddress,
    },
    message: {
      safeTxHash,
      totp: Math.floor(Date.now() / 3600e3),
    },
    primaryType: 'DeleteRequest',
  })
}

export const deleteTx = async ({
  chain,
  safeAddress,
  safeTxHash,
  signer,
}: {
  chain: DeleteTxChain
  safeAddress: string
  safeTxHash: string
  signer: JsonRpcSigner
}) => {
  const signature = await signTxServiceMessage(chain, safeAddress, safeTxHash, signer)
  return await deleteTransaction(chain.chainId, safeTxHash, signature)
}
