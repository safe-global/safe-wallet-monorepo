import { toHex } from '@safe-global/utils/features/walletconnect/utils'

// EIP-5792 GetCallsResult envelope (mirrors apps/web/.../safe-wallet-provider/index.ts).
// status codes: 100 PENDING | 200 CONFIRMED | 400 OFFCHAIN_FAILURE | 500 REVERTED.
export type GetCallsResult = {
  version: '2.0.0'
  id: string
  chainId: `0x${string}`
  status: number
  atomic: true
  receipts?: {
    logs: unknown[]
    status: `0x${string}`
    blockHash: `0x${string}`
    blockNumber: `0x${string}`
    gasUsed: `0x${string}`
    transactionHash: `0x${string}`
  }[]
}

// Raw eth_getTransactionReceipt JSON-RPC result — hex-string fields, as returned by
// provider.send(). Distinct from ethers' parsed TransactionReceipt class.
export type RawTxReceipt = {
  logs: unknown[]
  blockHash: `0x${string}`
  blockNumber: `0x${string}`
  gasUsed: `0x${string}`
  transactionHash: `0x${string}`
}

export type CallsStatusTx = {
  txStatus?: string
  txHash?: string | null
  txData?: { dataDecoded?: { parameters?: { valueDecoded?: unknown }[] | null } | null } | null
}

const mapTxStatus = (txStatus?: string): number =>
  txStatus === 'SUCCESS' ? 200 : txStatus === 'CANCELLED' ? 400 : txStatus === 'FAILED' ? 500 : 100

export const buildGetCallsResult = (
  id: string,
  numericChainId: string,
  tx: CallsStatusTx,
  receipt: RawTxReceipt | null,
): GetCallsResult => {
  const envelope = {
    version: '2.0.0' as const,
    id,
    chainId: toHex(numericChainId) as `0x${string}`,
    status: mapTxStatus(tx.txStatus),
    atomic: true as const,
  }
  if (!receipt) {
    return envelope
  }

  // Web replicates the same receipt for each underlying call in the bundle.
  const valueDecoded = tx.txData?.dataDecoded?.parameters?.[0]?.valueDecoded
  const callsCount = Array.isArray(valueDecoded) && valueDecoded.length > 0 ? valueDecoded.length : 1
  const onChainStatusHex = (tx.txStatus === 'SUCCESS' ? '0x1' : '0x0') as `0x${string}`

  return {
    ...envelope,
    receipts: Array.from({ length: callsCount }, () => ({
      logs: receipt.logs,
      status: onChainStatusHex,
      blockHash: receipt.blockHash,
      blockNumber: toHex(receipt.blockNumber) as `0x${string}`,
      gasUsed: toHex(receipt.gasUsed) as `0x${string}`,
      transactionHash: (tx.txHash ?? receipt.transactionHash) as `0x${string}`,
    })),
  }
}
