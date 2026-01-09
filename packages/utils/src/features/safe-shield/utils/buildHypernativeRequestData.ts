import type { SafeTransaction } from '@safe-global/types-kit'
import { calculateSafeTransactionHash } from '@safe-global/protocol-kit/dist/src/utils'
import type { HypernativeAssessmentRequestDto } from '@safe-global/store/hypernative/hypernativeApi.dto'

type BuildHypernativeRequestDataParams = {
  safeAddress: `0x${string}`
  chainId: string
  txData: SafeTransaction['data']
  walletAddress: string
  safeVersion: string
  origin?: string
}

/**
 * Builds a Hypernative assessment request payload from Safe transaction data
 *
 * @param params - Parameters required to build the request
 * @returns HypernativeAssessmentRequestDto or undefined if required data is missing
 */
export const buildHypernativeRequestData = ({
  safeAddress,
  chainId,
  txData,
  walletAddress,
  safeVersion,
  origin,
}: BuildHypernativeRequestDataParams): HypernativeAssessmentRequestDto | undefined => {
  if (!safeAddress || !chainId || !safeVersion || !walletAddress || !txData) {
    return undefined
  }

  const safeTxHash = calculateSafeTransactionHash(safeAddress, txData, safeVersion, BigInt(chainId)) as `0x${string}`

  if (!safeTxHash) {
    return undefined
  }

  return {
    safeAddress,
    safeTxHash,
    transaction: {
      chain: chainId,
      input: txData.data as `0x${string}`,
      operation: String(txData.operation),
      toAddress: txData.to as `0x${string}`,
      fromAddress: walletAddress as `0x${string}`,
      safeTxGas: txData.safeTxGas,
      value: txData.value,
      baseGas: txData.baseGas,
      gasPrice: txData.gasPrice,
      gasToken: txData.gasToken as `0x${string}`,
      refundReceiver: txData.refundReceiver as `0x${string}`,
      nonce: String(txData.nonce),
    },
    ...(origin ? { url: origin } : {}),
  }
}
