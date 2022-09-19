import {
  ChainInfo,
  ConflictType,
  DateLabel,
  ExecutionInfo,
  FEATURES,
  getTransactionDetails,
  MultisigExecutionDetails,
  MultisigExecutionInfo,
  Transaction,
  TransactionDetails,
  TransactionListItemType,
} from '@gnosis.pm/safe-react-gateway-sdk'
import { isModuleDetailedExecutionInfo, isMultisigDetailedExecutionInfo, isTxQueued } from './transaction-guards'
import { MetaTransactionData, OperationType } from '@gnosis.pm/safe-core-sdk-types/dist/src/types'
import { getGnosisSafeContractInstance } from '@/services/contracts/safeContracts'
import extractTxInfo from '@/services/tx/extractTxInfo'
import { createExistingTx } from '@/services/tx/txSender'
import { AdvancedParameters } from '@/components/tx/AdvancedParams'
import { TransactionOptions } from '@gnosis.pm/safe-core-sdk-types'
import { hasFeature } from '@/utils/chains'
import { startOfDay } from 'date-fns'

export const makeTxFromDetails = (txDetails: TransactionDetails): Transaction => {
  const getMissingSigners = ({
    signers,
    confirmations,
  }: MultisigExecutionDetails): MultisigExecutionInfo['missingSigners'] => {
    const missingSigners = signers.filter(({ value }) => {
      const hasConfirmed = confirmations?.some(({ signer }) => signer?.value === value)
      return !hasConfirmed
    })

    return missingSigners.length ? missingSigners : undefined
  }

  const getMultisigExecutionInfo = ({
    detailedExecutionInfo,
  }: TransactionDetails): MultisigExecutionInfo | undefined => {
    if (!isMultisigDetailedExecutionInfo(detailedExecutionInfo)) return undefined

    return {
      type: detailedExecutionInfo.type,
      nonce: detailedExecutionInfo.nonce,
      confirmationsRequired: detailedExecutionInfo.confirmationsRequired,
      confirmationsSubmitted: detailedExecutionInfo.confirmations?.length || 0,
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
    : txDetails.executedAt || now

  return {
    type: TransactionListItemType.TRANSACTION,
    transaction: {
      id: txDetails.txId,
      timestamp,
      txStatus: txDetails.txStatus,
      txInfo: txDetails.txInfo,
      executionInfo,
      safeAppInfo: txDetails?.safeAppInfo,
    },
    conflictType: ConflictType.NONE,
  }
}

export const makeDateLabelFromTx = (tx: Transaction): DateLabel => {
  const startOfDayTimestamp = startOfDay(tx.transaction.timestamp).getTime()
  return { timestamp: startOfDayTimestamp, type: TransactionListItemType.DATE_LABEL }
}

const getSignatures = (confirmations: Record<string, string>) => {
  return Object.entries(confirmations)
    .filter(([_, signature]) => Boolean(signature))
    .sort(([signerA], [signerB]) => signerA.toLowerCase().localeCompare(signerB.toLowerCase()))
    .reduce((prev, [_, signature]) => {
      return prev + signature.slice(2)
    }, '0x')
}

export const getMultiSendTxs = (
  txs: TransactionDetails[],
  chain: ChainInfo,
  safeAddress: string,
  safeVersion: string,
): MetaTransactionData[] => {
  const safeContractInstance = getGnosisSafeContractInstance(chain, safeVersion)

  return txs
    .map((tx) => {
      if (!isMultisigDetailedExecutionInfo(tx.detailedExecutionInfo)) return

      const args = extractTxInfo(tx, safeAddress)
      const sigs = getSignatures(args.signatures)

      const data = safeContractInstance.encode('execTransaction', [
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

export const getTxsWithDetails = (txs: Transaction[], chainId: string) => {
  return Promise.all(
    txs.map(async (tx) => {
      return await getTransactionDetails(chainId, tx.transaction.id)
    }),
  )
}

export const getSafeTxs = (txs: TransactionDetails[], chainId: string, safeAddress: string) => {
  return Promise.all(
    txs.map(async (tx) => {
      return await createExistingTx(chainId, safeAddress, tx.txId, tx)
    }),
  )
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
