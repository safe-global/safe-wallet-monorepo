import { useMemo } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { getSafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { useGetTransactionDetailsQuery } from '@/store/api/gateway'
import extractTxInfo from '@/services/tx/extractTxInfo'
import type { SafeTransaction, ChainInfo, SafeInfo } from '@safe-global/types-kit'
import { Safe__factory } from '@safe-global/utils/types/contracts'

const safeInterface = Safe__factory.createInterface()

/**
 * Information about a detected nested Safe transaction.
 * A nested transaction occurs when a Safe executes a transaction on another Safe.
 */
export type NestedTxInfo =
  | { type: 'approveHash'; signedHash: string; nestedSafeAddress: string }
  | { type: 'execTransaction'; nestedSafeAddress: string }
  | null

/**
 * Detects if a transaction is a nested Safe transaction.
 * Checks for approveHash or execTransaction calls to another Safe.
 *
 * @param safeTx - The Safe transaction to analyze
 * @returns Information about the nested transaction, or null if not nested
 */
export const detectNestedTransaction = (safeTx?: SafeTransaction): NestedTxInfo => {
  if (!safeTx?.data.data) return null

  const txData = safeTx.data.data
  const approveHashSelector = safeInterface.getFunction('approveHash').selector
  const execTransactionSelector = safeInterface.getFunction('execTransaction').selector

  if (txData.startsWith(approveHashSelector)) {
    try {
      const params = safeInterface.decodeFunctionData('approveHash', txData)
      return {
        type: 'approveHash' as const,
        signedHash: params[0] as string,
        nestedSafeAddress: safeTx.data.to,
      }
    } catch (e) {
      return null
    }
  }

  if (txData.startsWith(execTransactionSelector)) {
    return {
      type: 'execTransaction' as const,
      nestedSafeAddress: safeTx.data.to,
    }
  }

  return null
}


export interface UseNestedTransactionResult {
  nestedSafeInfo: SafeInfo | undefined
  nestedSafeTx: SafeTransaction | undefined
  isNested: boolean
}

/**
 * Hook to detect and fetch data for nested Safe transactions.
 *
 * A nested transaction occurs when a Safe executes a transaction on another Safe.
 * This hook:
 * 1. Detects if the transaction is nested (approveHash or execTransaction)
 * 2. Fetches transaction details if it's an approveHash call
 * 3. Fetches the nested Safe's information
 * 4. Constructs a SafeTransaction object for the nested transaction
 *
 * @param safeTx - The Safe transaction to analyze
 * @param chain - The current blockchain network information
 * @returns An object containing nested Safe info, nested transaction, and a boolean flag
 *
 * @example
 * ```typescript
 * const { nestedSafeInfo, nestedSafeTx, isNested } = useNestedTransaction(safeTx, chain)
 *
 * if (isNested) {
 *   // Handle nested transaction simulation
 * }
 * ```
 */
export const useNestedTransaction = (
  safeTx: SafeTransaction | undefined,
  chain: ChainInfo | undefined,
): UseNestedTransactionResult => {
  const nestedTxInfo = useMemo(() => detectNestedTransaction(safeTx), [safeTx])
  const { data: nestedTxDetails } = useGetTransactionDetailsQuery(
    nestedTxInfo?.type === 'approveHash' && nestedTxInfo.signedHash && chain
      ? {
          chainId: chain.chainId,
          txId: nestedTxInfo.signedHash,
        }
      : skipToken,
  )

  const [nestedSafeInfo] = useAsync(
    () =>
      !!chain && !!nestedTxInfo?.nestedSafeAddress
        ? getSafeInfo(chain.chainId, nestedTxInfo.nestedSafeAddress)
        : undefined,
    [chain, nestedTxInfo],
  )

  const nestedSafeTx = useMemo<SafeTransaction | undefined>(() => {
    if (!nestedTxInfo) return undefined

    if (nestedTxInfo.type === 'approveHash' && nestedTxDetails) {
      // Construct a minimal SafeTransaction object for the nested transaction.
      // The signature methods are no-ops because this is a read-only representation
      // used only for simulation purposes, not for collecting signatures.
      return {
        addSignature: () => {},
        encodedSignatures: () => '',
        getSignature: () => undefined,
        data: extractTxInfo(nestedTxDetails).txParams,
        signatures: new Map(),
      }
    }

    return undefined
  }, [nestedTxInfo, nestedTxDetails])

  const isNested = !!nestedTxInfo && !!nestedSafeInfo && !!nestedSafeTx

  return {
    nestedSafeInfo,
    nestedSafeTx,
    isNested,
  }
}
