import Safe, { buildSignatureBytes, EthSafeSignature, SigningMethod } from '@safe-global/protocol-kit'
import SafeTransaction from '@safe-global/protocol-kit/dist/src/utils/transactions/SafeTransaction'
import { ethers } from 'ethers'
import SafeApiKit from '@safe-global/api-kit'
import { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { createConnectedWallet } from '@/src/services/web3'
import { createExistingTx } from '@/src/services/tx/tx-sender'
import { SafeInfo } from '@/src/types/address'
import { SafeMultisigTransactionResponse } from '@safe-global/types-kit/dist/src/types'

type sendSignedTxParameters = {
  safeTx: SafeTransaction
  signatures: Record<string, string>
  protocolKit: Safe
  wallet: ethers.Wallet
  apiKit: SafeApiKit
}

export type signTxParams = {
  chain: ChainInfo
  activeSafe: SafeInfo
  txId: string
  privateKey?: string
}

export const signTx = async ({
  chain,
  activeSafe,
  txId,
  privateKey,
}: signTxParams): Promise<SafeMultisigTransactionResponse> => {
  if (!chain) {
    throw new Error('Active chain not found')
  }
  if (!privateKey) {
    throw new Error('Private key not found')
  }

  const { protocolKit, wallet } = await createConnectedWallet(privateKey, activeSafe, chain)
  const { safeTx, signatures } = await createExistingTx({
    activeSafe,
    txId,
    chain,
    privateKey,
  })

  const apiKit = new SafeApiKit({
    chainId: BigInt(activeSafe.chainId),
  })

  if (!safeTx) {
    throw new Error('Safe transaction not found')
  }

  const safeTransactionHash = await sendSignedTx({
    safeTx,
    signatures,
    protocolKit,
    wallet,
    apiKit,
  })
  const signedTransaction = await apiKit.getTransaction(safeTransactionHash)

  return signedTransaction
}

export const sendSignedTx = async ({
  safeTx,
  signatures,
  protocolKit,
  wallet,
  apiKit,
}: sendSignedTxParameters): Promise<string> => {
  const signedSafeTx = await protocolKit.signTransaction(safeTx, SigningMethod.ETH_SIGN)

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
