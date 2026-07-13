import { SigningMethod } from '@safe-global/types-kit'
import type { SafeTransaction } from '@safe-global/types-kit'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { createConnectedWallet } from '@/src/services/web3'
import { proposeTx } from '@/src/services/tx/tx-sender'
import { SafeInfo } from '@/src/types/address'

export type signTxParams = {
  chain: Chain
  activeSafe: SafeInfo
  txId: string
  privateKey?: string
  /**
   * Pre-built SafeTransaction for un-proposed (draft) transactions. When
   * supplied, the function signs this transaction directly instead of
   * fetching its data from CGW by `txId`.
   */
  prebuiltSafeTx?: SafeTransaction
}

export const signTx = async ({
  chain,
  activeSafe,
  txId,
  privateKey,
  prebuiltSafeTx,
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

  let safeTx: SafeTransaction | undefined = prebuiltSafeTx
  if (!safeTx) {
    const proposed = await proposeTx({ activeSafe, txId, chain, privateKey })
    safeTx = proposed.safeTx ?? undefined
  }

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
