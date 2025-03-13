import { SigningMethod } from '@safe-global/protocol-kit'
import { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { createConnectedWallet } from '@/src/services/web3'
import { proposeTx } from '@/src/services/tx/tx-sender'
import { SafeInfo } from '@/src/types/address'

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
}: signTxParams): Promise<{
  signature: string
  safeTransactionHash: string
}> => {
  if (!chain) {
    throw new Error('Active chain not found')
  }
  if (!privateKey) {
    throw new Error('Private key not found')
  }

  const { protocolKit, wallet } = await createConnectedWallet(privateKey, activeSafe, chain)
  const { safeTx } = await proposeTx({
    activeSafe,
    txId,
    chain,
    privateKey,
  })

  if (!safeTx) {
    throw new Error('Safe transaction not found')
  }

  const signedSafeTx = await protocolKit.signTransaction(safeTx, SigningMethod.ETH_SIGN_TYPED_DATA_V4)

  const safeTransactionHash = await protocolKit.getTransactionHash(signedSafeTx)

  const signature = signedSafeTx.getSignature(wallet.address)?.data

  if (!signature) {
    throw new Error('Signature not found')
  }

  return {
    signature,
    safeTransactionHash,
  }
}
