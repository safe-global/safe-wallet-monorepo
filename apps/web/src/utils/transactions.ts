import type {
  ChainInfo,
  ExecutionInfo,
  MultisigExecutionDetails,
  MultisigExecutionInfo,
  SafeAppData,
  Transaction,
  TransactionDetails,
  TransactionListPage,
  TransactionSummary,
} from '@safe-global/safe-gateway-typescript-sdk'
import { ConflictType, getTransactionDetails, TransactionListItemType } from '@safe-global/safe-gateway-typescript-sdk'
import {
  isERC20Transfer,
  isModuleDetailedExecutionInfo,
  isMultisigDetailedExecutionInfo,
  isMultisigExecutionInfo,
  isTransactionListItem,
  isTransferTxInfo,
  isTxQueued,
} from './transaction-guards'
import type { MetaTransactionData } from '@safe-global/safe-core-sdk-types/dist/src/types'
import { OperationType } from '@safe-global/safe-core-sdk-types/dist/src/types'
import { getReadOnlyGnosisSafeContract } from '@/services/contracts/safeContracts'
import extractTxInfo from '@/services/tx/extractTxInfo'
import type { AdvancedParameters } from '@/components/tx/AdvancedParams'
import type { SafeTransaction, TransactionOptions } from '@safe-global/safe-core-sdk-types'
import uniqBy from 'lodash/uniqBy'
import { Errors, logError } from '@/services/exceptions'
import { type BaseTransaction } from '@safe-global/safe-apps-sdk'
import { isEmptyHexData } from '@/utils/hex'
import { isMultiSendCalldata } from './transaction-calldata'
import { decodeMultiSendData } from '@safe-global/protocol-kit/dist/src/utils'
import { getOriginPath } from './url'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'

export const makeTxFromDetails = (txDetails: TransactionDetails): Transaction => {
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
  chain: ChainInfo,
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

export const getTxOptions = (params: AdvancedParameters, currentChain: ChainInfo | undefined): TransactionOptions => {
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

export const getQueuedTransactionCount = (txPage?: TransactionListPage): string => {
  if (!txPage) {
    return '0'
  }

  const queuedTxs = txPage.results.filter(isTransactionListItem)

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

export const isTrustedTx = (tx: TransactionSummary) => {
  return (
    isMultisigExecutionInfo(tx.executionInfo) ||
    isModuleDetailedExecutionInfo(tx.executionInfo) ||
    !isTransferTxInfo(tx.txInfo) ||
    !isERC20Transfer(tx.txInfo.transferInfo) ||
    Boolean(tx.txInfo.transferInfo.trusted)
  )
}

export const isImitation = ({ txInfo }: TransactionSummary): boolean => {
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
