import { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeInfo } from '@/src/types/address'
import { createConnectedWallet } from '../../web3'
import { proposeTx } from '@/src/services/tx/tx-sender/create'

interface ExecuteTxParams {
  chain: ChainInfo
  activeSafe: SafeInfo
  txId: string
  privateKey: string
}

export const executeTx = async ({ chain, activeSafe, txId, privateKey }: ExecuteTxParams): Promise<string> => {
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

  const { hash } = await protocolKit.executeTransaction(safeTx)

  return hash
}
