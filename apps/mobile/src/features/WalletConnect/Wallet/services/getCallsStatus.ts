import { chainIdToHex } from '@safe-global/utils/features/walletconnect/utils'

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

// Minimal shape of the CGW transaction details this builder reads (assignable from the
// generated TransactionDetails, whose nested fields are nullable).
export type CallsStatusTx = {
  txStatus?: string
  txHash?: string | null
  txData?: { dataDecoded?: { parameters?: { valueDecoded?: unknown }[] | null } | null } | null
}

// BundleTxStatuses (verbatim from web):
//   AWAITING_CONFIRMATIONS / AWAITING_EXECUTION → 100 PENDING
//   SUCCESS → 200 CONFIRMED | CANCELLED → 400 OFFCHAIN_FAILURE | FAILED → 500 REVERTED
const mapTxStatus = (txStatus?: string): number =>
  txStatus === 'SUCCESS' ? 200 : txStatus === 'CANCELLED' ? 400 : txStatus === 'FAILED' ? 500 : 100

/**
 * Build the EIP-5792 GetCallsResult envelope from a CGW transaction and an optional on-chain
 * receipt. Pure: the caller fetches `tx` (and `receipt` when there's a tx hash to look up).
 * When `receipt` is null the envelope is still valid (a pending / off-chain-failed bundle).
 */
export const buildGetCallsResult = (
  id: string,
  numericChainId: string,
  tx: CallsStatusTx,
  receipt: RawTxReceipt | null,
): GetCallsResult => {
  const envelope = {
    version: '2.0.0' as const,
    id,
    chainId: chainIdToHex(numericChainId) as `0x${string}`,
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
      // chainIdToHex (BigInt-based) handles block numbers / gas above 2^53 and normalizes padding.
      blockNumber: chainIdToHex(receipt.blockNumber) as `0x${string}`,
      gasUsed: chainIdToHex(receipt.gasUsed) as `0x${string}`,
      transactionHash: (tx.txHash ?? receipt.transactionHash) as `0x${string}`,
    })),
  }
}
