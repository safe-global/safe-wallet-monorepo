import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeInfo } from '@/src/types/address'
import { proposeTx, addSignaturesToTx } from '@/src/services/tx/tx-sender/create'
import { createConnectedWallet } from '@/src/services/web3'
import { EstimatedFeeValues } from '@/src/store/estimatedFeeSlice'

interface ExecuteTxParams {
  chain: Chain
  activeSafe: SafeInfo
  txId: string
  privateKey: string
  feeParams: EstimatedFeeValues | null
}

export const executeTx = async ({ chain, activeSafe, txId, privateKey, feeParams }: ExecuteTxParams) => {
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

  addSignaturesToTx(safeTx, signatures)

  return protocolKit.executeTransaction(
    safeTx,
    feeParams
      ? {
          gasLimit: feeParams.gasLimit.toString(),
          maxFeePerGas: feeParams.maxFeePerGas.toString(),
          maxPriorityFeePerGas: feeParams.maxPriorityFeePerGas.toString(),
          nonce: feeParams.nonce,
        }
      : undefined,
  )
}
