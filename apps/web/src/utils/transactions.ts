import type {
  MultisigExecutionDetails,
  MultisigExecutionInfo,
  ModuleTransaction,
  TransactionDetails,
  Transaction,
  QueuedItemPage,
  ModuleTransactionPage,
  IncomingTransferPage,
  MultisigTransactionPage,
  TransactionItemPage,
  CreationTransaction,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

import type { ExecutionInfo } from '@safe-global/store/gateway/types'
import { ConflictType, TransactionListItemType } from '@safe-global/store/gateway/types'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { cgwApi as estimationsApi } from '@safe-global/store/gateway/AUTO_GENERATED/estimations'
import { cgwApi as safesApi } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import type { EstimationResponse, GetEstimationDto } from '@safe-global/store/gateway/AUTO_GENERATED/estimations'
import type { SafeNonces } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import {
  isERC20Transfer,
  isModuleDetailedExecutionInfo,
  isMultisigDetailedExecutionInfo,
  isMultisigExecutionInfo,
  isTransactionQueuedItem,
  isTransferTxInfo,
  isTxQueued,
} from './transaction-guards'
import { getReadOnlyGnosisSafeContract } from '@/services/contracts/safeContracts'
import extractTxInfo from '@/services/tx/extractTxInfo'
import type { AdvancedParameters } from '@/components/tx/AdvancedParams'
import type { SafeTransaction, TransactionOptions, MetaTransactionData } from '@safe-global/types-kit'
import { OperationType } from '@safe-global/types-kit'
import uniqBy from 'lodash/uniqBy'
import { Errors, logError } from '@/services/exceptions'
import { type BaseTransaction } from '@safe-global/safe-apps-sdk'
import { isEmptyHexData } from '@/utils/hex'
import { isMultiSendCalldata } from './transaction-calldata'
import { decodeMultiSendData } from '@safe-global/protocol-kit/dist/src/utils'
import { getOriginPath } from './url'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import { getStoreInstance } from '@/store'

// Re-exported from tx-details.ts to avoid pulling heavy deps into the bundle
import { getTransactionDetails } from '@/utils/tx-details'
export { getTransactionDetails }

/**
 * Delete a transaction from the gateway using RTK Query.
 * This function can be used in non-React contexts (e.g., async functions, services).
 * It dispatches the mutation and waits for the result.
 *
 * @param chainId - The chain ID where the transaction exists
 * @param safeTxHash - The Safe transaction hash to delete
 * @param signature - Signature proving authorization to delete the transaction
 * @throws Error if the store is not initialized or if the request fails
 */
export const deleteTransaction = async (chainId: string, safeTxHash: string, signature: string): Promise<void> => {
  const store = getStoreInstance()

  await store
    .dispatch(
      cgwApi.endpoints.transactionsDeleteTransactionV1.initiate({
        chainId,
        safeTxHash,
        deleteTransactionDto: {
          signature,
        },
      }),
    )
    .unwrap()
}

/**
 * Fetch module transactions from the gateway using RTK Query.
 * This function can be used in non-React contexts (e.g., async functions, services).
 * It dispatches the query and waits for the result.
 *
 * @param chainId - The chain ID where the Safe exists
 * @param safeAddress - The Safe address
 * @param query - Optional query parameters (to, module, transaction_hash)
 * @param pageUrl - Optional pagination URL
 * @returns The module transaction page
 * @throws Error if the store is not initialized or if the request fails
 */
export const getModuleTransactions = async (
  chainId: string,
  safeAddress: string,
  query?: {
    to?: string
    module?: string
    transaction_hash?: string
  },
  pageUrl?: string,
): Promise<ModuleTransactionPage> => {
  const store = getStoreInstance()

  // If pageUrl is provided, parse cursor from it
  const cursor = pageUrl ? new URL(pageUrl).searchParams.get('cursor') || undefined : undefined

  const result = await store
    .dispatch(
      cgwApi.endpoints.transactionsGetModuleTransactionsV1.initiate(
        {
          chainId,
          safeAddress,
          to: query?.to,
          module: query?.module,
          transactionHash: query?.transaction_hash,
          cursor,
        },
        {
          forceRefetch: true,
        },
      ),
    )
    .unwrap()

  return result
}

/**
 * Fetch incoming transfers from the gateway using RTK Query.
 * This function can be used in non-React contexts (e.g., async functions, services).
 * It dispatches the query and waits for the result.
 *
 * @param chainId - The chain ID where the Safe exists
 * @param safeAddress - The Safe address
 * @param query - Optional query parameters (trusted, execution_date__gte, execution_date__lte, to, value, token_address)
 * @param pageUrl - Optional pagination URL
 * @returns The incoming transfer page
 * @throws Error if the store is not initialized or if the request fails
 */
export const getIncomingTransfers = async (
  chainId: string,
  safeAddress: string,
  query?: {
    trusted?: boolean
    execution_date__gte?: string
    execution_date__lte?: string
    to?: string
    value?: string
    token_address?: string
  },
  pageUrl?: string,
): Promise<IncomingTransferPage> => {
  const store = getStoreInstance()

  // If pageUrl is provided, parse cursor from it
  const cursor = pageUrl ? new URL(pageUrl).searchParams.get('cursor') || undefined : undefined

  const result = await store
    .dispatch(
      cgwApi.endpoints.transactionsGetIncomingTransfersV1.initiate(
        {
          chainId,
          safeAddress,
          trusted: query?.trusted,
          executionDateGte: query?.execution_date__gte,
          executionDateLte: query?.execution_date__lte,
          to: query?.to,
          value: query?.value,
          tokenAddress: query?.token_address,
          cursor,
        },
        {
          forceRefetch: true,
        },
      ),
    )
    .unwrap()

  return result
}

/**
 * Fetch multisig transactions from the gateway using RTK Query.
 * This function can be used in non-React contexts (e.g., async functions, services).
 * It dispatches the query and waits for the result.
 *
 * @param chainId - The chain ID where the Safe exists
 * @param safeAddress - The Safe address
 * @param query - Optional query parameters (execution_date__gte, execution_date__lte, to, value, nonce, executed)
 * @param pageUrl - Optional pagination URL
 * @returns The multisig transaction page
 * @throws Error if the store is not initialized or if the request fails
 */
export const getMultisigTransactions = async (
  chainId: string,
  safeAddress: string,
  query?: {
    execution_date__gte?: string
    execution_date__lte?: string
    to?: string
    value?: string
    nonce?: string
    executed?: string | boolean
  },
  pageUrl?: string,
): Promise<MultisigTransactionPage> => {
  const store = getStoreInstance()

  // If pageUrl is provided, parse cursor from it
  const cursor = pageUrl ? new URL(pageUrl).searchParams.get('cursor') || undefined : undefined

  // Convert executed string to boolean if needed (for backwards compatibility with old SDK)
  const executed =
    query?.executed !== undefined
      ? typeof query.executed === 'string'
        ? query.executed === 'true'
        : query.executed
      : undefined

  const result = await store
    .dispatch(
      cgwApi.endpoints.transactionsGetMultisigTransactionsV1.initiate(
        {
          chainId,
          safeAddress,
          executionDateGte: query?.execution_date__gte,
          executionDateLte: query?.execution_date__lte,
          to: query?.to,
          value: query?.value,
          nonce: query?.nonce,
          executed,
          cursor,
        },
        {
          forceRefetch: true,
        },
      ),
    )
    .unwrap()

  return result
}

/**
 * Fetch transaction history from the gateway using RTK Query.
 * This function can be used in non-React contexts (e.g., async functions, services).
 * It dispatches the query and waits for the result.
 *
 * @param chainId - The chain ID where the Safe exists
 * @param safeAddress - The Safe address
 * @param query - Optional query parameters (timezone, trusted, imitation)
 * @param pageUrl - Optional pagination URL
 * @returns The transaction history page
 * @throws Error if the store is not initialized or if the request fails
 */
export const getTransactionHistory = async (
  chainId: string,
  safeAddress: string,
  query?: {
    timezone?: string
    trusted?: boolean
    imitation?: boolean
  },
  pageUrl?: string,
): Promise<TransactionItemPage> => {
  const store = getStoreInstance()

  // If pageUrl is provided, parse cursor from it
  const cursor = pageUrl ? new URL(pageUrl).searchParams.get('cursor') || undefined : undefined

  const result = await store
    .dispatch(
      cgwApi.endpoints.transactionsGetTransactionsHistoryV1.initiate(
        {
          chainId,
          safeAddress,
          timezone: query?.timezone,
          trusted: query?.trusted,
          imitation: query?.imitation,
          cursor,
        },
        {
          forceRefetch: true,
        },
      ),
    )
    .unwrap()

  return result
}

/**
 * Fetch Safe nonces from the gateway using RTK Query.
 * This function can be used in non-React contexts (e.g., async functions, services).
 * It dispatches the query and waits for the result.
 *
 * @param chainId - The chain ID where the Safe exists
 * @param safeAddress - The Safe address
 * @returns The Safe nonces (current and recommended)
 * @throws Error if the store is not initialized or if the request fails
 */
export const getNonces = async (chainId: string, safeAddress: string): Promise<SafeNonces> => {
  const store = getStoreInstance()

  const result = await store
    .dispatch(
      safesApi.endpoints.safesGetNoncesV1.initiate(
        {
          chainId,
          safeAddress,
        },
        {
          forceRefetch: true,
        },
      ),
    )
    .unwrap()

  return result
}

/**
 * Post Safe gas estimation to the gateway using RTK Query.
 * This function can be used in non-React contexts (e.g., async functions, services).
 * It dispatches the mutation and waits for the result.
 *
 * @param chainId - The chain ID where the Safe exists
 * @param safeAddress - The Safe address
 * @param estimationData - Transaction details for gas estimation
 * @returns The estimation response with recommended nonce and safeTxGas
 * @throws Error if the store is not initialized or if the request fails
 */
export const postSafeGasEstimation = async (
  chainId: string,
  safeAddress: string,
  estimationData: GetEstimationDto,
): Promise<EstimationResponse> => {
  const store = getStoreInstance()

  const result = await store
    .dispatch(
      estimationsApi.endpoints.estimationsGetEstimationV2.initiate({
        chainId,
        address: safeAddress,
        getEstimationDto: estimationData,
      }),
    )
    .unwrap()

  return result
}

export const makeTxFromDetails = (txDetails: TransactionDetails): ModuleTransaction => {
  const getMissingSigners = ({
    signers,
    confirmations,
    confirmationsRequired,
  }: MultisigExecutionDetails): MultisigExecutionInfo['missingSigners'] => {
    if (confirmations.length >= confirmationsRequired) return

    const missingSigners = signers.filter(({ value }) => {
      const hasConfirmed = confirmations?.some(({ signer }) => signer?.value === value)
      return !hasConfirmed
    })

    return missingSigners.length > 0 ? missingSigners : undefined
  }

  const getMultisigExecutionInfo = ({
    detailedExecutionInfo,
  }: TransactionDetails): MultisigExecutionInfo | undefined => {
    if (!isMultisigDetailedExecutionInfo(detailedExecutionInfo)) return undefined

    return {
      type: detailedExecutionInfo.type,
      nonce: detailedExecutionInfo.nonce,
      confirmationsRequired: detailedExecutionInfo.confirmationsRequired,
      confirmationsSubmitted: detailedExecutionInfo.confirmations?.length ?? 0,
      missingSigners: getMissingSigners(detailedExecutionInfo),
    }
  }

  const executionInfo: ExecutionInfo | undefined = isModuleDetailedExecutionInfo(txDetails.detailedExecutionInfo)
    ? (txDetails.detailedExecutionInfo as ExecutionInfo)
    : getMultisigExecutionInfo(txDetails)

  // Will only be used as a fallback whilst waiting on backend tx creation cache
  const now = Date.now()
  const timestamp = isTxQueued(txDetails.txStatus)
    ? isMultisigDetailedExecutionInfo(txDetails.detailedExecutionInfo)
      ? txDetails.detailedExecutionInfo.submittedAt
      : now
    : (txDetails.executedAt ?? now)

  return {
    type: TransactionListItemType.TRANSACTION,
    transaction: {
      id: txDetails.txId,
      timestamp,
      txStatus: txDetails.txStatus,
      txInfo: txDetails.txInfo,
      executionInfo,
      safeAppInfo: txDetails?.safeAppInfo,
      txHash: txDetails?.txHash || null,
    },
    conflictType: ConflictType.NONE,
  }
}

export const getSafeTxHashFromTxId = (txId: string) => {
  if (txId.startsWith('multisig_')) {
    return txId.slice(-66)
  }

  return
}

const getSignatures = (confirmations: Record<string, string>) => {
  return Object.entries(confirmations)
    .filter(([, signature]) => Boolean(signature))
    .sort(([signerA], [signerB]) => signerA.toLowerCase().localeCompare(signerB.toLowerCase()))
    .reduce((prev, [, signature]) => {
      return prev + signature.slice(2)
    }, '0x')
}

export const getMultiSendTxs = async (
  txs: TransactionDetails[],
  chain: Chain,
  safeAddress: string,
  safeVersion: string,
): Promise<MetaTransactionData[]> => {
  const readOnlySafeContract = await getReadOnlyGnosisSafeContract(chain, safeVersion)

  return txs
    .map((tx) => {
      if (!isMultisigDetailedExecutionInfo(tx.detailedExecutionInfo)) return

      const args = extractTxInfo(tx)
      const sigs = getSignatures(args.signatures)

      // @ts-ignore
      const data = readOnlySafeContract.encode('execTransaction', [
        args.txParams.to,
        args.txParams.value,
        args.txParams.data,
        args.txParams.operation,
        args.txParams.safeTxGas,
        args.txParams.baseGas,
        args.txParams.gasPrice,
        args.txParams.gasToken,
        args.txParams.refundReceiver,
        sigs,
      ])

      return {
        operation: OperationType.Call,
        to: safeAddress,
        value: '0',
        data,
      }
    })
    .filter(Boolean) as MetaTransactionData[]
}

export const getTxOptions = (params: AdvancedParameters, currentChain: Chain | undefined): TransactionOptions => {
  const txOptions: TransactionOptions = {
    gasLimit: params.gasLimit?.toString(),
    maxFeePerGas: params.maxFeePerGas?.toString(),
    maxPriorityFeePerGas: params.maxPriorityFeePerGas?.toString(),
    nonce: params.userNonce,
  }

  // Some chains don't support EIP-1559 gas price params
  if (currentChain && !hasFeature(currentChain, FEATURES.EIP1559)) {
    txOptions.gasPrice = txOptions.maxFeePerGas
    delete txOptions.maxFeePerGas
    delete txOptions.maxPriorityFeePerGas
  }

  return txOptions
}

export const getQueuedTransactionCount = (txPage?: QueuedItemPage): string => {
  if (!txPage) {
    return '0'
  }

  const queuedTxs = txPage.results.filter(isTransactionQueuedItem)

  const queuedTxsByNonce = uniqBy(queuedTxs, (item) =>
    isMultisigExecutionInfo(item.transaction.executionInfo) ? item.transaction.executionInfo.nonce : '',
  )

  if (txPage.next) {
    return `> ${queuedTxsByNonce.length}`
  }

  return queuedTxsByNonce.length.toString()
}

export const getTxOrigin = (app?: Partial<SafeAppData>): string | undefined => {
  if (!app) return

  const MAX_ORIGIN_LENGTH = 200
  const { url = '', name = '' } = app
  let origin: string | undefined

  try {
    // Must include empty string to avoid including the length of `undefined`
    const maxUrlLength = MAX_ORIGIN_LENGTH - JSON.stringify({ url: '', name: '' }).length
    const trimmedUrl = getOriginPath(url).slice(0, maxUrlLength)

    const maxNameLength = Math.max(0, maxUrlLength - trimmedUrl.length)
    const trimmedName = name.slice(0, maxNameLength)

    origin = JSON.stringify({ url: trimmedUrl, name: trimmedName })
  } catch (e) {
    logError(Errors._808, e)
  }

  return origin
}

export const decodeSafeTxToBaseTransactions = (safeTx: SafeTransaction): BaseTransaction[] => {
  const txs: BaseTransaction[] = []
  const safeTxData = safeTx.data.data
  if (isMultiSendCalldata(safeTxData)) {
    txs.push(...decodeMultiSendData(safeTxData))
  } else {
    txs.push({
      data: safeTxData,
      value: safeTx.data.value,
      to: safeTx.data.to,
    })
  }
  return txs
}

export const isRejectionTx = (tx?: SafeTransaction) => {
  return !!tx && !!tx.data.data && isEmptyHexData(tx.data.data) && tx.data.value === '0'
}

export const isTrustedTx = (tx: Transaction) => {
  return (
    isMultisigExecutionInfo(tx.executionInfo) ||
    isModuleDetailedExecutionInfo(tx.executionInfo) ||
    !isTransferTxInfo(tx.txInfo) ||
    !isERC20Transfer(tx.txInfo.transferInfo) ||
    Boolean(tx.txInfo.transferInfo.trusted)
  )
}

export const isImitation = ({ txInfo }: Transaction): boolean => {
  return isTransferTxInfo(txInfo) && isERC20Transfer(txInfo.transferInfo) && Boolean(txInfo.transferInfo.imitation)
}

export const getSafeTransaction = async (safeTxHash: string, chainId: string, safeAddress: string) => {
  const txId = `multisig_${safeAddress}_${safeTxHash}`

  try {
    return await getTransactionDetails(chainId, txId)
  } catch (e) {
    return undefined
  }
}

/**
 * Fetch creation transaction data from the gateway using RTK Query.
 * This function can be used in non-React contexts (e.g., async functions, services).
 * It dispatches the query and waits for the result.
 *
 * @param chainId - The chain ID where the Safe was deployed
 * @param safeAddress - The Safe address
 * @returns The creation transaction data
 * @throws Error if the store is not initialized or if the request fails
 */
export const getCreationTransaction = async (chainId: string, safeAddress: string): Promise<CreationTransaction> => {
  const store = getStoreInstance()

  const result = await store
    .dispatch(
      cgwApi.endpoints.transactionsGetCreationTransactionV1.initiate(
        {
          chainId,
          safeAddress,
        },
        {
          forceRefetch: true,
        },
      ),
    )
    .unwrap()

  return result
}
