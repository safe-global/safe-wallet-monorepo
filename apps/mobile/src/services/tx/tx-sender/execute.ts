import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeInfo } from '@/src/types/address'
import { proposeTx } from '@/src/services/tx/tx-sender/create'
import { createConnectedWallet } from '@/src/services/web3'

interface ExecuteTxParams {
  chain: Chain
  activeSafe: SafeInfo
  txId: string
  privateKey: string
}

export const executeTx = async ({ chain, activeSafe, txId, privateKey }: ExecuteTxParams) => {
  if (!chain) {
    throw new Error('Active chain not found')
  }
  if (!privateKey) {
    throw new Error('Private key not found')
  }

  const { protocolKit } = await createConnectedWallet(privateKey, activeSafe, chain)

  const { safeTx, signatures } = await proposeTx({
    activeSafe,
    txId,
    chain,
    privateKey,
  })

  if (!safeTx) {
    throw new Error('Safe transaction not found')
  }

  Object.entries(signatures).forEach(([signer, data]) => {
    safeTx.addSignature({
      signer,
      data,
      staticPart: () => data,
      dynamicPart: () => '',
      isContractSignature: false,
    })
  })

  return protocolKit.executeTransaction(safeTx)
}
