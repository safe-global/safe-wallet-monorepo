import type { SafeSignature, SafeTransaction, SafeTransactionData, SafeVersion } from '@safe-global/types-kit'
import { calculateSafeTransactionHash, EthSafeSignature } from '@safe-global/protocol-kit'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

/**
 * Type guard to check if data is a SafeTransactionData.
 */
export function isSafeTransactionData(data: unknown): data is SafeTransactionData {
  return (
    data != null &&
    typeof data === 'object' &&
    'to' in data &&
    'value' in data &&
    'data' in data &&
    'operation' in data &&
    'safeTxGas' in data &&
    'baseGas' in data &&
    'gasPrice' in data &&
    'gasToken' in data &&
    'refundReceiver' in data &&
    'nonce' in data
  )
}
/**
 * Type guard to check if data is a SafeTransaction.
 */
export function isSafeTransaction(data: unknown): data is SafeTransaction {
  return (
    data != null &&
    typeof data === 'object' &&
    'data' in data &&
    isSafeTransactionData(data.data) &&
    'signatures' in data
  )
}

export const getNestedExecTransactionHash = ({
  safeAddress,
  safeVersion,
  chainId,
  txData,
}: {
  safeAddress: string
  safeVersion: SafeVersion | string
  chainId: Chain['chainId']
  txData: SafeTransactionData
}): string => {
  if (!safeAddress || !safeVersion) {
    return ''
  }

  const normalizedChainId = BigInt(chainId)

  try {
    return calculateSafeTransactionHash(safeAddress, txData, safeVersion as SafeVersion, normalizedChainId)
  } catch {
    return ''
  }
}

export const getNestedExecTransactionHashFromInfo = ({
  safeAddress,
  safeVersion,
  chainId,
  txParams,
  nonce,
}: {
  safeAddress: string
  safeVersion?: SafeVersion | string
  chainId?: Chain['chainId']
  txParams: Omit<SafeTransactionData, 'nonce'>
  nonce?: unknown
}): string => {
  if (!safeVersion || chainId === undefined || nonce === undefined) {
    return ''
  }

  const txData: SafeTransactionData = {
    ...txParams,
    nonce: Number(nonce),
  }

  return getNestedExecTransactionHash({
    safeAddress,
    safeVersion,
    chainId,
    txData,
  })
}

const STATIC_PART_HEX_LENGTH = 65 * 2

/** v = 0 contract signatures keep only their data, so buildSignatureBytes sets an offset past every static part */
export const toSafeSignature = (signer: string, signature: string): SafeSignature => {
  const hex = signature.startsWith('0x') ? signature.slice(2) : signature
  const isContractSignature = hex.length > STATIC_PART_HEX_LENGTH && hex.slice(128, 130) === '00'

  if (isContractSignature) {
    const offset = Number.parseInt(hex.slice(64, 128), 16) * 2
    const length = Number.parseInt(hex.slice(offset, offset + 64), 16) * 2

    if (
      Number.isSafeInteger(offset) &&
      offset >= STATIC_PART_HEX_LENGTH &&
      Number.isSafeInteger(length) &&
      offset + 64 + length === hex.length
    ) {
      return new EthSafeSignature(signer, `0x${hex.slice(offset + 64)}`, true)
    }
  }

  return new EthSafeSignature(signer, signature)
}
