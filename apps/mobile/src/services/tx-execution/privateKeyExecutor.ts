import { executeTx } from '@/src/services/tx/tx-sender/execute'
import { getUserNonce } from '@/src/services/web3'
import { getPrivateKey } from '@/src/hooks/useSign/useSign'
import { ExecutionMethod } from '@/src/features/HowToExecuteSheet/types'
import logger from '@/src/utils/logger'
import type { EstimatedFeeValues } from '@/src/store/estimatedFeeSlice'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { SafeInfo } from '@/src/types/address'

interface ExecuteSingleTxParams {
  chain: Chain
  activeSafe: SafeInfo
  txId: string
  signerAddress: string
  feeParams: EstimatedFeeValues | null
}

interface ExecuteSingleTxResult {
  type: ExecutionMethod.WITH_PK
  txId: string
  chainId: string
  safeAddress: string
  txHash: string
  walletAddress: string
  walletNonce: number
}

export const executeSingleTx = async ({
  chain,
  activeSafe,
  txId,
  signerAddress,
  feeParams,
}: ExecuteSingleTxParams): Promise<ExecuteSingleTxResult> => {
  let privateKey
  try {
    privateKey = await getPrivateKey(signerAddress)
  } catch (error) {
    logger.error('Error loading private key:', error)
    throw error
  }

  if (!privateKey) {
    throw new Error('Private key not found')
  }

  const walletNonce = await getUserNonce(chain, signerAddress)

  const { hash } = await executeTx({
    chain,
    activeSafe,
    txId,
    privateKey,
    feeParams,
  })

  return {
    type: ExecutionMethod.WITH_PK,
    txId,
    chainId: chain.chainId,
    safeAddress: activeSafe.address,
    txHash: hash,
    walletAddress: signerAddress,
    walletNonce,
  }
}
