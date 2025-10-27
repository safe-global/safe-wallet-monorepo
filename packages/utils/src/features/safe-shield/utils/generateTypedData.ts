import type { SafeTransaction, SafeVersion } from '@safe-global/types-kit'
import { generateTypedData as generateTypedDataProtocolKit } from '@safe-global/protocol-kit'
import { isEIP712TypedData } from '../../../utils/safe-messages'
import { normalizeTypedData } from '../../../utils/web3'
import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'

const DEFAULT_SAFE_VERSION: SafeVersion = '1.3.0'

/**
 * Generates EIP-712 typed data for Safe Shield threat analysis
 *
 * Converts SafeTransaction objects to EIP-712 typed data format, or normalizes
 * existing TypedData objects. This is used to prepare transaction data for
 * security analysis APIs.
 *
 * @param params - Configuration object
 * @param params.data - Either a SafeTransaction to convert or existing TypedData to normalize
 * @param params.safeAddress - The Safe contract address (0x-prefixed hex string)
 * @param params.chainId - The chain ID as a string
 * @param params.safeVersion - Optional Safe contract version (defaults to '1.3.0')
 * @returns Normalized EIP-712 typed data ready for threat analysis
 *
 * @example
 * ```typescript
 * const typedData = generateTypedData({
 *   data: safeTx,
 *   safeAddress: '0x123...',
 *   chainId: '1',
 *   safeVersion: '1.3.0'
 * })
 * ```
 */
export function generateTypedData({
  data,
  safeAddress,
  chainId,
  safeVersion,
}: {
  data: SafeTransaction | TypedData
  safeAddress: `0x${string}`
  chainId: string
  safeVersion?: string
}): TypedData {
  if (isEIP712TypedData(data)) {
    return normalizeTypedData(data)
  } else {
    const typedData = generateTypedDataProtocolKit({
      safeAddress,
      safeVersion: safeVersion ?? DEFAULT_SAFE_VERSION,
      chainId: BigInt(chainId),
      data: data.data,
    }) as unknown as TypedData

    typedData.domain.chainId = Number(chainId)
    return typedData
  }
}
