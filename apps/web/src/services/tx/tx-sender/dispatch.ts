import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { isMultisigExecutionInfo } from '@/utils/transaction-guards'
import { isHardwareWallet, isSmartContractWallet } from '@/utils/wallets'
import type { MultiSendCallOnlyContractImplementationType } from '@safe-global/protocol-kit'
import {
  type ChainInfo,
  relayTransaction,
  type SafeInfo,
  type TransactionDetails,
} from '@safe-global/safe-gateway-typescript-sdk'
import type {
  SafeSignature,
  SafeTransaction,
  Transaction,
  TransactionOptions,
  TransactionResult,
} from '@safe-global/safe-core-sdk-types'
import { didRevert } from '@/utils/ethers-utils'
import { type SpendingLimitTxParams } from '@/components/tx-flow/flows/TokenTransfer/ReviewSpendingLimitTx'
import { getSpendingLimitContract } from '@/services/contracts/spendingLimitContracts'
import type { ContractTransactionResponse, Eip1193Provider, Overrides, TransactionResponse } from 'ethers'
import type { RequestId } from '@safe-global/safe-apps-sdk'
import proposeTx from '../proposeTransaction'
import { txDispatch, TxEvent } from '../txEvents'
import { waitForRelayedTx } from '@/services/tx/txMonitor'
import { getReadOnlyCurrentGnosisSafeContract } from '@/services/contracts/safeContracts'
import {
  getAndValidateSafeSDK,
  getSafeSDKWithSigner,
  tryOffChainTxSigning,
  getUncheckedSigner,
  prepareTxExecution,
  prepareApproveTxHash,
} from './sdk'
import { createWeb3, getUserNonce } from '@/hooks/wallets/web3'
import { asError } from '@/services/exceptions/utils'
import chains from '@/config/chains'
import { createExistingTx } from './create'
import { getLatestSafeVersion } from '@/utils/chains'

/**
 * Propose a transaction
 * If txId is passed, it's an existing tx being signed
 */
export const dispatchTxProposal = async ({
  chainId,
  safeAddress,
  sender,
  safeTx,
  txId,
  origin,
}: {
  chainId: string
  safeAddress: string
  sender: string
  safeTx: SafeTransaction
  txId?: string
  origin?: string
}): Promise<TransactionDetails> => {
  const safeSDK = getAndValidateSafeSDK()
  const safeTxHash = await safeSDK.getTransactionHash(safeTx)

  let proposedTx: TransactionDetails | undefined
  try {
    proposedTx = await proposeTx(chainId, safeAddress, sender, safeTx, safeTxHash, origin)
  } catch (error) {
    if (txId) {
      txDispatch(TxEvent.SIGNATURE_PROPOSE_FAILED, { txId, error: asError(error) })
    } else {
      txDispatch(TxEvent.PROPOSE_FAILED, { error: asError(error) })
    }
    throw error
  }

  // Dispatch a success event only if the tx is signed
  // Unsigned txs are proposed only temporarily and won't appear in the queue
  if (safeTx.signatures.size > 0) {
    txDispatch(txId ? TxEvent.SIGNATURE_PROPOSED : TxEvent.PROPOSED, {
      txId: proposedTx.txId,
      signerAddress: txId ? sender : undefined,
      nonce: safeTx.data.nonce,
    })
  }

  return proposedTx
}

/**
 * Sign a transaction
 */
export const dispatchTxSigning = async (
  safeTx: SafeTransaction,
  safeVersion: SafeInfo['version'],
  provider: Eip1193Provider,
  txId?: string,
): Promise<SafeTransaction> => {
  const sdk = await getSafeSDKWithSigner(provider)

  let signedTx: SafeTransaction | undefined
  try {
    signedTx = await tryOffChainTxSigning(safeTx, safeVersion, sdk)
  } catch (error) {
    txDispatch(TxEvent.SIGN_FAILED, {
      txId,
      error: asError(error),
    })
    throw error
  }

  txDispatch(TxEvent.SIGNED, { txId })

  return signedTx
}

// We have to manually sign because sdk.signTransaction doesn't support proposers
export const dispatchProposerTxSigning = async (safeTx: SafeTransaction, wallet: ConnectedWallet) => {
  const sdk = await getSafeSDKWithSigner(wallet.provider)

  let signature: SafeSignature
  if (isHardwareWallet(wallet)) {
    const txHash = await sdk.getTransactionHash(safeTx)
    signature = await sdk.signHash(txHash)
  } else {
    signature = await sdk.signTypedData(safeTx)
  }

  safeTx.addSignature(signature)

  return safeTx
}

const ZK_SYNC_ON_CHAIN_SIGNATURE_GAS_LIMIT = 4_500_000

/**
 * On-Chain sign a transaction
 */
export const dispatchOnChainSigning = async (
  safeTx: SafeTransaction,
  txId: string,
  provider: Eip1193Provider,
  chainId: SafeInfo['chainId'],
  signerAddress: string,
  safeAddress: string,
  isNestedSafe: boolean,
) => {
  const sdk = await getSafeSDKWithSigner(provider)
  const safeTxHash = await sdk.getTransactionHash(safeTx)
  const eventParams = { txId, nonce: safeTx.data.nonce }

  const options = chainId === chains.zksync ? { gasLimit: ZK_SYNC_ON_CHAIN_SIGNATURE_GAS_LIMIT } : undefined
  let txHashOrParentSafeTxHash: string
  try {
    // TODO: This is a workaround until there is a fix for unchecked transactions in the protocol-kit
    const encodedApproveHashTx = await prepareApproveTxHash(safeTxHash, provider)

    // Note: SafeWalletProvider returns transaction hash if it exists, otherwise the safeTxHash
    // If the parent immediately executes, this will be the transaction hash of the approveHash
    // otherwise the safeTxHash of it
    txHashOrParentSafeTxHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [{ from: signerAddress, to: safeAddress, data: encodedApproveHashTx, gas: options?.gasLimit }],
    })

    txDispatch(TxEvent.ONCHAIN_SIGNATURE_REQUESTED, eventParams)
  } catch (err) {
    txDispatch(TxEvent.FAILED, { ...eventParams, error: asError(err) })
    throw err
  }

  txDispatch(TxEvent.ONCHAIN_SIGNATURE_SUCCESS, eventParams)

  if (isNestedSafe) {
    txDispatch(TxEvent.NESTED_SAFE_TX_CREATED, {
      ...eventParams,
      txHashOrParentSafeTxHash,
      parentSafeAddress: signerAddress,
    })
  }

  // Until the on-chain signature is/has been executed, the safeTx is not
  // signed so we don't return it
}

export const dispatchSafeTxSpeedUp = async (
  txOptions: Omit<TransactionOptions, 'nonce'> & { nonce: number },
  txId: string,
  provider: Eip1193Provider,
  chainId: SafeInfo['chainId'],
  signerAddress: string,
  safeAddress: string,
  nonce: number,
) => {
  const sdk = await getSafeSDKWithSigner(provider)
  const eventParams = { txId, nonce }
  const signerNonce = txOptions.nonce
  const isSmartAccount = await isSmartContractWallet(chainId, signerAddress)

  // Execute the tx
  let result: TransactionResult | undefined
  try {
    const safeTx = await createExistingTx(chainId, safeAddress, txId)

    // TODO: This is a workaround until there is a fix for unchecked transactions in the protocol-kit
    if (isSmartAccount) {
      const encodedTx = await prepareTxExecution(safeTx, provider)
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{ from: signerAddress, to: safeAddress, data: encodedTx }],
      })

      result = {
        hash: txHash,
        transactionResponse: null,
      }
    } else {
      result = await sdk.executeTransaction(safeTx, txOptions)
    }
    txDispatch(TxEvent.EXECUTING, eventParams)
  } catch (error) {
    txDispatch(TxEvent.SPEEDUP_FAILED, { ...eventParams, error: asError(error) })
    throw error
  }

  txDispatch(TxEvent.PROCESSING, {
    ...eventParams,
    txHash: result.hash,
    signerAddress,
    signerNonce,
    gasLimit: txOptions.gasLimit,
    txType: 'SafeTx',
  })

  return result.hash
}

export const dispatchCustomTxSpeedUp = async (
  txOptions: Omit<TransactionOptions, 'nonce'> & { nonce: number },
  txId: string,
  to: string,
  data: string,
  provider: Eip1193Provider,
  signerAddress: string,
  nonce: number,
) => {
  const eventParams = { txId, nonce }
  const signerNonce = txOptions.nonce

  // Execute the tx
  let result: TransactionResponse | undefined
  try {
    const signer = await getUncheckedSigner(provider)
    result = await signer.sendTransaction({ to, data, ...txOptions })
    txDispatch(TxEvent.EXECUTING, eventParams)
  } catch (error) {
    txDispatch(TxEvent.SPEEDUP_FAILED, { ...eventParams, error: asError(error) })
    throw error
  }

  txDispatch(TxEvent.PROCESSING, {
    txHash: result.hash,
    signerAddress,
    signerNonce,
    data,
    to,
    groupKey: result?.hash,
    txType: 'Custom',
    nonce,
  })

  return result.hash
}

/**
 * Execute a transaction
 */
export const dispatchTxExecution = async (
  safeTx: SafeTransaction,
  txOptions: TransactionOptions,
  txId: string,
  provider: Eip1193Provider,
  signerAddress: string,
  safeAddress: string,
  isSmartAccount: boolean,
): Promise<string> => {
  const sdk = await getSafeSDKWithSigner(provider)
  const eventParams = { txId, nonce: safeTx.data.nonce }

  const signerNonce = txOptions.nonce ?? (await getUserNonce(signerAddress))

  // Execute the tx
  let result: TransactionResult | undefined
  try {
    // TODO: This is a workaround until there is a fix for unchecked transactions in the protocol-kit
    if (isSmartAccount) {
      const encodedTx = await prepareTxExecution(safeTx, provider)
      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [{ from: signerAddress, to: safeAddress, data: encodedTx }],
      })

      result = {
        hash: txHash,
        transactionResponse: null,
      }
    } else {
      result = await sdk.executeTransaction(safeTx, txOptions)
    }
    txDispatch(TxEvent.EXECUTING, { ...eventParams })
  } catch (error) {
    txDispatch(TxEvent.FAILED, { ...eventParams, error: asError(error) })
    throw error
  }

  txDispatch(TxEvent.PROCESSING, {
    ...eventParams,
    nonce: safeTx.data.nonce,
    txHash: result.hash,
    signerAddress,
    signerNonce,
    gasLimit: txOptions.gasLimit,
    txType: 'SafeTx',
  })

  return result.hash
}

export const dispatchBatchExecution = async (
  txs: TransactionDetails[],
  multiSendContract: MultiSendCallOnlyContractImplementationType,
  multiSendTxData: string,
  provider: Eip1193Provider,
  signerAddress: string,
  safeAddress: string,
  overrides: Omit<Overrides, 'nonce'> & { nonce: number },
  nonce: number,
) => {
  const groupKey = multiSendTxData

  let result: ContractTransactionResponse
  const txIds = txs.map((tx) => tx.txId)
  let signerNonce = overrides.nonce
  let txData = multiSendContract.encode('multiSend', [multiSendTxData])

  try {
    if (signerNonce === undefined || signerNonce === null) {
      signerNonce = await getUserNonce(signerAddress)
    }
    const signer = await getUncheckedSigner(provider)
    // @ts-ignore
    result = await multiSendContract.contract.connect(signer).multiSend(multiSendTxData, overrides)

    txIds.forEach((txId) => {
      txDispatch(TxEvent.EXECUTING, { txId, groupKey, nonce })
    })
  } catch (err) {
    txIds.forEach((txId) => {
      txDispatch(TxEvent.FAILED, { txId, error: asError(err), groupKey, nonce })
    })
    throw err
  }
  const txTo = await multiSendContract.getAddress()

  txIds.forEach((txId) => {
    txDispatch(TxEvent.PROCESSING, {
      txId,
      txHash: result.hash,
      groupKey,
      signerNonce,
      signerAddress,
      txType: 'Custom',
      data: txData,
      to: txTo,
      nonce,
    })
  })

  return result!.hash
}

/**
 * Execute a module transaction
 */
export const dispatchModuleTxExecution = async (
  tx: Transaction,
  provider: Eip1193Provider,
  safeAddress: string,
): Promise<string> => {
  const id = JSON.stringify(tx)

  let result: TransactionResponse | undefined
  try {
    const browserProvider = createWeb3(provider)
    const signer = await browserProvider.getSigner()

    txDispatch(TxEvent.EXECUTING, { groupKey: id })
    result = await signer.sendTransaction(tx)
  } catch (error) {
    txDispatch(TxEvent.FAILED, { groupKey: id, error: asError(error) })
    throw error
  }

  txDispatch(TxEvent.PROCESSING_MODULE, {
    groupKey: id,
    txHash: result.hash,
  })

  result
    ?.wait()
    .then((receipt) => {
      if (receipt === null) {
        txDispatch(TxEvent.FAILED, { groupKey: id, error: new Error('No transaction receipt found') })
      } else if (didRevert(receipt)) {
        txDispatch(TxEvent.REVERTED, {
          groupKey: id,
          error: new Error('Transaction reverted by EVM'),
        })
      } else {
        txDispatch(TxEvent.PROCESSED, { groupKey: id, safeAddress, txHash: result?.hash })
      }
    })
    .catch((error) => {
      txDispatch(TxEvent.FAILED, { groupKey: id, error: asError(error) })
    })

  return result?.hash
}

export const dispatchSpendingLimitTxExecution = async (
  txParams: SpendingLimitTxParams,
  txOptions: TransactionOptions,
  provider: Eip1193Provider,
  chainId: SafeInfo['chainId'],
  safeAddress: string,
) => {
  const id = JSON.stringify(txParams)

  let result: ContractTransactionResponse | undefined
  try {
    const signer = await getUncheckedSigner(provider)
    const contract = getSpendingLimitContract(chainId, signer)

    result = await contract.executeAllowanceTransfer(
      txParams.safeAddress,
      txParams.token,
      txParams.to,
      txParams.amount,
      txParams.paymentToken,
      txParams.payment,
      txParams.delegate,
      txParams.signature,
      txOptions,
    )
    txDispatch(TxEvent.EXECUTING, { groupKey: id })
  } catch (error) {
    txDispatch(TxEvent.FAILED, { groupKey: id, error: asError(error) })
    throw error
  }

  txDispatch(TxEvent.PROCESSING_MODULE, {
    groupKey: id,
    txHash: result.hash,
  })

  result
    ?.wait()
    .then((receipt) => {
      if (receipt === null) {
        txDispatch(TxEvent.FAILED, { groupKey: id, error: new Error('No transaction receipt found') })
      } else if (didRevert(receipt)) {
        txDispatch(TxEvent.REVERTED, {
          groupKey: id,
          error: new Error('Transaction reverted by EVM'),
        })
      } else {
        txDispatch(TxEvent.PROCESSED, { groupKey: id, safeAddress, txHash: result?.hash })
      }
    })
    .catch((error) => {
      txDispatch(TxEvent.FAILED, { groupKey: id, error: asError(error) })
    })

  return result?.hash
}

export const dispatchSafeAppsTx = async (
  safeTx: SafeTransaction,
  safeAppRequestId: RequestId,
  provider: Eip1193Provider,
  txId?: string,
): Promise<string> => {
  const sdk = await getSafeSDKWithSigner(provider)
  const safeTxHash = await sdk.getTransactionHash(safeTx)
  txDispatch(TxEvent.SAFE_APPS_REQUEST, { safeAppRequestId, safeTxHash, txId })
  return safeTxHash
}

export const dispatchTxRelay = async (
  safeTx: SafeTransaction,
  safe: SafeInfo,
  txId: string,
  chain: ChainInfo,
  gasLimit?: string | number,
) => {
  const readOnlySafeContract = await getReadOnlyCurrentGnosisSafeContract(safe)

  let transactionToRelay = safeTx
  const data = readOnlySafeContract.encode('execTransaction', [
    transactionToRelay.data.to,
    transactionToRelay.data.value,
    transactionToRelay.data.data,
    transactionToRelay.data.operation,
    transactionToRelay.data.safeTxGas,
    transactionToRelay.data.baseGas,
    transactionToRelay.data.gasPrice,
    transactionToRelay.data.gasToken,
    transactionToRelay.data.refundReceiver,
    transactionToRelay.encodedSignatures(),
  ])

  try {
    const relayResponse = await relayTransaction(safe.chainId, {
      to: safe.address.value,
      data,
      gasLimit: gasLimit?.toString(),
      version: safe.version ?? getLatestSafeVersion(chain),
    })
    const taskId = relayResponse.taskId

    if (!taskId) {
      throw new Error('Transaction could not be relayed')
    }

    txDispatch(TxEvent.RELAYING, { taskId, txId, nonce: safeTx.data.nonce })

    // Monitor relay tx
    waitForRelayedTx(taskId, [txId], safe.address.value, safeTx.data.nonce)
  } catch (error) {
    txDispatch(TxEvent.FAILED, { txId, error: asError(error), nonce: safeTx.data.nonce })
    throw error
  }
}

export const dispatchBatchExecutionRelay = async (
  txs: TransactionDetails[],
  multiSendContract: MultiSendCallOnlyContractImplementationType,
  multiSendTxData: string,
  chainId: string,
  safeAddress: string,
  safeVersion: string,
) => {
  const to = await multiSendContract.getAddress()
  const data = multiSendContract.contract.interface.encodeFunctionData('multiSend', [multiSendTxData])
  const groupKey = multiSendTxData

  let relayResponse
  try {
    relayResponse = await relayTransaction(chainId, {
      to,
      data,
      version: safeVersion,
    })
  } catch (error) {
    txs.forEach(({ txId }) => {
      txDispatch(TxEvent.FAILED, {
        txId,
        error: asError(error),
        groupKey,
      })
    })
    throw error
  }

  const taskId = relayResponse.taskId
  txs.forEach(({ txId, detailedExecutionInfo }) => {
    if (isMultisigExecutionInfo(detailedExecutionInfo)) {
      txDispatch(TxEvent.RELAYING, { taskId, txId, groupKey, nonce: detailedExecutionInfo.nonce })
    }
  })

  // Monitor relay tx
  waitForRelayedTx(
    taskId,
    txs.map((tx) => tx.txId),
    safeAddress,
    isMultisigExecutionInfo(txs[0].detailedExecutionInfo) ? txs[0].detailedExecutionInfo.nonce : 0,
    groupKey,
  )
}
