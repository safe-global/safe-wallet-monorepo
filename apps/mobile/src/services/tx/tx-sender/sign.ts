import Safe, { buildSignatureBytes, EthSafeSignature, SigningMethod } from '@safe-global/protocol-kit'
import SafeTransaction from '@safe-global/protocol-kit/dist/src/utils/transactions/SafeTransaction'
import { ethers } from 'ethers'
import SafeApiKit from '@safe-global/api-kit'

type signTxParameters = {
  safeTx: SafeTransaction
  signatures: Record<string, string>
  protocolKit: Safe
  wallet: ethers.Wallet
  apiKit: SafeApiKit
}

export const signTx = async ({
  safeTx,
  signatures,
  protocolKit,
  wallet,
  apiKit,
}: signTxParameters): Promise<string> => {
  const signedSafeTx = await protocolKit.signTransaction(safeTx, SigningMethod.ETH_SIGN)
  console.log({ signedSafeTx })

  Object.entries(signatures).forEach(([signer, data]) => {
    signedSafeTx.addSignature({
      signer,
      data,
      staticPart: () => data,
      dynamicPart: () => '',
      isContractSignature: false,
    })
  })
  const safeTransactionHash = await protocolKit.getTransactionHash(signedSafeTx)

  const signature = signedSafeTx.getSignature(wallet.address) as EthSafeSignature

  await apiKit.confirmTransaction(safeTransactionHash, buildSignatureBytes([signature]))

  return safeTransactionHash
}
