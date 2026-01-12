import { useMemo } from 'react'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { getSafeInfo, type SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import extractTxInfo from '@/services/tx/extractTxInfo'
import type { SafeTransaction, SafeTransactionData } from '@safe-global/types-kit'
import type { OperationType } from '@safe-global/types-kit'
import { toDecimalString } from '@safe-global/utils/utils/numbers'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import { getNestedExecTransactionHashFromInfo } from '@safe-global/utils/utils/safeTransaction'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

const safeInterface = Safe__factory.createInterface()

type NestedExecTransactionParams = Omit<SafeTransactionData, 'nonce'>
/**
 * Information about a detected nested Safe transaction.
 * A nested transaction occurs when a Safe executes a transaction on another Safe.
 */
export type NestedTxInfo =
  | { type: 'approveHash'; signedHash: string; nestedSafeAddress: string }
  | { type: 'execTransaction'; txParams: NestedExecTransactionParams; nestedSafeAddress: string }
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
    try {
      const decodedParams = safeInterface.decodeFunctionData('execTransaction', txData) as unknown[]

      if (!decodedParams || decodedParams.length < 9) {
        return null
      }

      const [to, value, data, operation, safeTxGas, baseGas, gasPrice, gasToken, refundReceiver] = decodedParams

      return {
        type: 'execTransaction' as const,
        nestedSafeAddress: safeTx.data.to,
        txParams: {
          to: to as string,
          value: toDecimalString(value),
          data: data as string,
          operation: Number(operation) as OperationType,
          safeTxGas: toDecimalString(safeTxGas),
          baseGas: toDecimalString(baseGas),
          gasPrice: toDecimalString(gasPrice),
          gasToken: gasToken as string,
          refundReceiver: refundReceiver as string,
        },
      }
    } catch (error) {
      return null
    }
  }

  return null
}

export interface UseNestedTransactionResult {
  nestedSafeInfo: SafeInfo | undefined
  nestedSafeTx: SafeTransaction | undefined
  isNested: boolean
  isNestedLoading: boolean
}

/**
 * Hook to detect and fetch data for nested Safe transactions.
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
  chain: Chain | undefined,
): UseNestedTransactionResult => {
  const nestedTxInfo = useMemo(() => detectNestedTransaction(safeTx), [safeTx])
  const [nestedSafeInfo, , nestedSafeInfoLoading] = useAsync(
    () =>
      !!chain && !!nestedTxInfo?.nestedSafeAddress
        ? getSafeInfo(chain.chainId, nestedTxInfo.nestedSafeAddress)
        : undefined,
    [chain, nestedTxInfo],
  )

  const nestedTxHash = useMemo(() => {
    if (!nestedTxInfo) return ''

    if (nestedTxInfo.type === 'approveHash') {
      return nestedTxInfo.signedHash
    }

    return getNestedExecTransactionHashFromInfo({
      safeAddress: nestedTxInfo.nestedSafeAddress,
      safeVersion: nestedSafeInfo?.version ?? undefined,
      chainId: chain?.chainId,
      txParams: nestedTxInfo.txParams,
      nonce: nestedSafeInfo?.nonce,
    })
  }, [nestedTxInfo, nestedSafeInfo, chain])

  const { data: nestedTxDetails, isLoading: nestedTxDetailsLoading } = useTransactionsGetTransactionByIdV1Query(
    {
      chainId: chain?.chainId || '',
      id: nestedTxHash,
    },
    {
      skip: !nestedTxInfo || !chain?.chainId || !nestedTxHash,
    },
  )

  const nestedSafeTx = useMemo<SafeTransaction | undefined>(() => {
    if (!nestedTxInfo || !nestedTxDetails) return undefined

    return {
      addSignature: () => {},
      encodedSignatures: () => '',
      getSignature: () => undefined,
      data: extractTxInfo(nestedTxDetails).txParams,
      signatures: new Map(),
    }
  }, [nestedTxInfo, nestedTxDetails])

  const isNested = !!nestedTxInfo && !!nestedSafeInfo && !!nestedSafeTx
  const isNestedLoading = !!nestedTxInfo && !isNested && (nestedSafeInfoLoading || nestedTxDetailsLoading)

  return {
    nestedSafeInfo,
    nestedSafeTx,
    isNested,
    isNestedLoading,
  }
}
