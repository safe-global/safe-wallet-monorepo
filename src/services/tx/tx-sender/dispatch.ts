import type { SafeInfo, TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeTransaction, TransactionOptions, TransactionResult, SafeSignature } from '@safe-global/safe-core-sdk-types'
import type { EthersError } from '@/utils/ethers-utils'
import { didReprice, didRevert } from '@/utils/ethers-utils'
import type MultiSendCallOnlyEthersContract from '@safe-global/safe-ethers-lib/dist/src/contracts/MultiSendCallOnly/MultiSendCallOnlyEthersContract'
import { type SpendingLimitTxParams } from '@/components/tx-flow/flows/TokenTransfer/ReviewSpendingLimitTx'
import { getSpendingLimitContract } from '@/services/contracts/spendingLimitContracts'
import type { ContractTransaction, PayableOverrides } from 'ethers'
import type { RequestId } from '@safe-global/safe-apps-sdk'
import proposeTx from '../proposeTransaction'
import { txDispatch, TxEvent } from '../txEvents'
import { waitForRelayedTx } from '@/services/tx/txMonitor'
import { getReadOnlyCurrentGnosisSafeContract } from '@/services/contracts/safeContracts'
import { sponsoredCall } from '@/services/tx/relaying'
import {
  getAndValidateSafeSDK,
  getSafeSDKWithSigner,
  getUncheckedSafeSDK,
  assertWalletChain,
  tryOffChainTxSigning,
} from './sdk'
import { createWeb3 } from '@/hooks/wallets/web3'
import { type OnboardAPI } from '@web3-onboard/core'
import { asError } from '@/services/exceptions/utils'

// From Chase
import { _scheduleTransaction as schedTransaction } from '../hsgsuper'
import type Safe from '@safe-global/safe-core-sdk'
import { BigNumber } from '@ethersproject/bignumber'
import EthersAdapter from '@safe-global/safe-ethers-lib'
import { ethers } from 'ethers';

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
  onboard: OnboardAPI,
  chainId: SafeInfo['chainId'],
  txId?: string,
): Promise<SafeTransaction> => {
  const sdk = await getSafeSDKWithSigner(onboard, chainId)

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

/**
 * On-Chain sign a transaction
 */
export const dispatchOnChainSigning = async (
  safeTx: SafeTransaction,
  txId: string,
  onboard: OnboardAPI,
  chainId: SafeInfo['chainId'],
) => {
  const sdkUnchecked = await getUncheckedSafeSDK(onboard, chainId)
  const safeTxHash = await sdkUnchecked.getTransactionHash(safeTx)
  const eventParams = { txId }

  try {
    // With the unchecked signer, the contract call resolves once the tx
    // has been submitted in the wallet not when it has been executed
    await sdkUnchecked.approveTransactionHash(safeTxHash)
    txDispatch(TxEvent.ONCHAIN_SIGNATURE_REQUESTED, eventParams)
  } catch (err) {
    txDispatch(TxEvent.FAILED, { ...eventParams, error: asError(err) })
    throw err
  }

  txDispatch(TxEvent.ONCHAIN_SIGNATURE_SUCCESS, eventParams)

  // Until the on-chain signature is/has been executed, the safeTx is not
  // signed so we don't return it
}

/**
 * Execute a transaction
 */
export const dispatchTxExecution = async (
  safeTx: SafeTransaction,
  txOptions: TransactionOptions,
  txId: string,
  onboard: OnboardAPI,
  chainId: SafeInfo['chainId'],
  safeAddress: string,
): Promise<string> => {
  const sdkUnchecked = await getUncheckedSafeSDK(onboard, chainId)
  const eventParams = { txId }

  // Execute the tx
  let result: TransactionResult | undefined
  try {
    result = await sdkUnchecked.executeTransaction(safeTx, txOptions)
    txDispatch(TxEvent.EXECUTING, eventParams)
  } catch (error) {
    txDispatch(TxEvent.FAILED, { ...eventParams, error: asError(error) })
    throw error
  }

  txDispatch(TxEvent.PROCESSING, { ...eventParams, txHash: result.hash })

  // Asynchronously watch the tx to be mined/validated
  result.transactionResponse
    ?.wait()
    .then((receipt) => {
      if (didRevert(receipt)) {
        txDispatch(TxEvent.REVERTED, { ...eventParams, error: new Error('Transaction reverted by EVM') })
      } else {
        txDispatch(TxEvent.PROCESSED, { ...eventParams, safeAddress })
      }
    })
    .catch((err) => {
      const error = err as EthersError

      if (didReprice(error)) {
        txDispatch(TxEvent.PROCESSED, { ...eventParams, safeAddress })
      } else {
        txDispatch(TxEvent.FAILED, { ...eventParams, error: asError(error) })
      }
    })

  return result.hash
}

/**
 * Author: Chase
 * Execute a transaction through HSGSuperMod (timelockcontroller)
 * Really this shouldn't be its own function. Should probably just be a flag on the already existing function
 */
export const dispatchTxScheduleExec = async (
  safeTx: SafeTransaction,
  txOptions: TransactionOptions,
  txId: string,
  onboard: OnboardAPI,
  chainId: SafeInfo['chainId'],
  safeAddress: string,
): Promise<string> => {
  const sdkUnchecked = await getUncheckedSafeSDK(onboard, chainId)
  const eventParams = { txId }

  // Execute the tx
  let result: TransactionResult | undefined
  try {
    result = await schedTransaction(sdkUnchecked, safeTx, true, txOptions)
    txDispatch(TxEvent.EXECUTING, eventParams)
  } catch (error) {
    txDispatch(TxEvent.FAILED, { ...eventParams, error: asError(error) })
    throw error
  }

  txDispatch(TxEvent.PROCESSING, { ...eventParams, txHash: result.hash })

  // Asynchronously watch the tx to be mined/validated
  result.transactionResponse
    ?.wait()
    .then((receipt) => {
      if (didRevert(receipt)) {
        txDispatch(TxEvent.REVERTED, { ...eventParams, error: new Error('Transaction reverted by EVM') })
      } else {
        txDispatch(TxEvent.PROCESSED, { ...eventParams, safeAddress })
      }
    })
    .catch((err) => {
      const error = err as EthersError

      if (didReprice(error)) {
        txDispatch(TxEvent.PROCESSED, { ...eventParams, safeAddress })
      } else {
        txDispatch(TxEvent.FAILED, { ...eventParams, error: asError(error) })
      }
    })

  return result.hash
}

/**
 * Author: Chase
 * Schedule a transaction through HSGSuperMod
 */
export const dispatchTxSchedule = async (
  safeTx: SafeTransaction,
  txOptions: TransactionOptions,
  txId: string,
  onboard: OnboardAPI,
  chainId: SafeInfo['chainId'],
  safeAddress: string,
): Promise<string> => {
  const sdkUnchecked = await getUncheckedSafeSDK(onboard, chainId)
  const eventParams = { txId }

  // Execute the tx
  let result: TransactionResult | undefined
  try {
    result = await schedTransaction(sdkUnchecked, safeTx, false, txOptions)
    txDispatch(TxEvent.EXECUTING, eventParams)
  } catch (error) {
    txDispatch(TxEvent.FAILED, { ...eventParams, error: asError(error) })
    throw error
  }

  txDispatch(TxEvent.PROCESSING, { ...eventParams, txHash: result.hash })

  // Asynchronously watch the tx to be mined/validated
  result.transactionResponse
    ?.wait()
    .then((receipt) => {
      if (didRevert(receipt)) {
        txDispatch(TxEvent.REVERTED, { ...eventParams, error: new Error('Transaction reverted by EVM') })
      } else {
        txDispatch(TxEvent.PROCESSED, { ...eventParams, safeAddress })
      }
    })
    .catch((err) => {
      const error = err as EthersError

      if (didReprice(error)) {
        txDispatch(TxEvent.PROCESSED, { ...eventParams, safeAddress })
      } else {
        txDispatch(TxEvent.FAILED, { ...eventParams, error: asError(error) })
      }
    })

  return result.hash
}

/**
 * Author: Chase
 * From: https://github.com/safe-global/safe-core-sdk/blob/725f473aa7308b0e5748e7d2e08522645140dd52/packages/safe-core-sdk/src/Safe.ts#L855
 * @param safeTransaction 
 * @param isScheduled true if the transaction has already been scheduled in the timelock. false otherwise
 * @param options 
 * @returns 
 */
const _scheduleTransaction = async (
  sdk: Safe,
  safeTransaction: SafeTransaction,
  isScheduled: boolean,
  options?: TransactionOptions
): Promise<TransactionResult> => {
  let transaction = safeTransaction

  const signedSafeTransaction = await sdk.copyTransaction(transaction)

  const txHash = await sdk.getTransactionHash(signedSafeTransaction)
  const signerAddress = await sdk.getEthAdapter().getSignerAddress()

  // NOTE: The following adds prevalidated signatures to the transaction, which breaks since we're executing through timelock.
  //        This may break the immediate execution feature
  // const ownersWhoApprovedTx = await sdk.getOwnersWhoApprovedTx(txHash)
  // for (const owner of ownersWhoApprovedTx) {
  //   signedSafeTransaction.addSignature(_generatePreValidatedSignature(owner))
  // }
  // const owners = await sdk.getOwners()
  // const signerAddress = await sdk.getEthAdapter().getSignerAddress()
  // if (signerAddress && owners.includes(signerAddress)) {
  //   signedSafeTransaction.addSignature(_generatePreValidatedSignature(signerAddress))
  // }

  const threshold = await sdk.getThreshold()
  if (threshold > signedSafeTransaction.signatures.size) {
    const signaturesMissing = threshold - signedSafeTransaction.signatures.size
    throw new Error(
      `There ${signaturesMissing > 1 ? 'are' : 'is'} ${signaturesMissing} signature${signaturesMissing > 1 ? 's' : ''
      } missing`
    )
  }

  const value = BigNumber.from(signedSafeTransaction.data.value)
  if (!value.isZero()) {
    const balance = await sdk.getBalance()
    if (value.gt(BigNumber.from(balance))) {
      throw new Error('Not enough Ether funds')
    }
  }

  if (options?.gas && options?.gasLimit) {
    throw new Error('Cannot specify gas and gasLimit together in transaction options')
  }
  const txResponse = await _scheduleTransactionContract(
    signedSafeTransaction,
    isScheduled,
    {
      from: signerAddress,
      ...options
    }
  )
  return txResponse
}

// from: https://github.com/safe-global/safe-core-sdk/blob/725f473aa7308b0e5748e7d2e08522645140dd52/packages/safe-ethers-lib/src/contracts/GnosisSafe/GnosisSafeContractEthers.ts#L130
const _scheduleTransactionContract = async (
  safeTransaction: SafeTransaction,
  isScheduled: boolean,
  options?: TransactionOptions
): Promise<TransactionResult> => {
  if (options && !options.gasLimit) {
    // options.gasLimit = await this.estimateGas(
    //   'execTransaction',
    //   [
    //     safeTransaction.data.to,
    //     safeTransaction.data.value,
    //     safeTransaction.data.data,
    //     safeTransaction.data.operation,
    //     safeTransaction.data.safeTxGas,
    //     safeTransaction.data.baseGas,
    //     safeTransaction.data.gasPrice,
    //     safeTransaction.data.gasToken,
    //     safeTransaction.data.refundReceiver,
    //     safeTransaction.encodedSignatures()
    //   ],
    //   {
    //     ...options
    //   }
    // )
    // CHASE Need at least 90,000 for it to be enough gas.
    options.gasLimit = 300_000;
  }
  const address = "0x9045781E1E982198BEd965EB3cED7b2D1EC8baa2";
  const inter: ethers.ContractInterface = JSON.parse(`[
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        },
        {
          "internalType": "enum Enum.Operation",
          "name": "operation",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "safeTxGas",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "baseGas",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "gasPrice",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "gasToken",
          "type": "address"
        },
        {
          "internalType": "address payable",
          "name": "refundReceiver",
          "type": "address"
        },
        {
          "internalType": "bytes",
          "name": "signatures",
          "type": "bytes"
        }
      ],
      "name": "scheduleTransaction",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "to",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "value",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "data",
          "type": "bytes"
        },
        {
          "internalType": "enum Enum.Operation",
          "name": "operation",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "safeTxGas",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "baseGas",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "gasPrice",
          "type": "uint256"
        },
        {
          "internalType": "address",
          "name": "gasToken",
          "type": "address"
        },
        {
          "internalType": "address payable",
          "name": "refundReceiver",
          "type": "address"
        },
        {
          "internalType": "bytes",
          "name": "signatures",
          "type": "bytes"
        }
      ],
      "stateMutability": "payable",
      "type": "function",
      "name": "executeTimelockTransaction"
    }]`);
  let metamask: ethers.providers.ExternalProvider;
  if (window.ethereum)
    metamask = window.ethereum
  else {
    console.log("Metamask not available");
    throw "Metamask not available"
  }

  const provider = new ethers.providers.Web3Provider(metamask)

  // MetaMask requires requesting permission to connect users accounts
  await provider.send("eth_requestAccounts", []);

  // The MetaMask plugin also allows signing transactions to
  // send ether and pay to change state within the blockchain.
  // For this, you need the account signer...
  const signerTwo = provider.getSigner()
  const contract = new ethers.Contract(address, inter, signerTwo);
  let txResponse: ContractTransaction
  if (isScheduled) {
    console.log("Dispatch: Executing through timelock")
    txResponse = await contract.executeTimelockTransaction(
      safeTransaction.data.to,
      safeTransaction.data.value,
      safeTransaction.data.data,
      safeTransaction.data.operation,
      safeTransaction.data.safeTxGas,
      safeTransaction.data.baseGas,
      safeTransaction.data.gasPrice,
      safeTransaction.data.gasToken,
      safeTransaction.data.refundReceiver,
      safeTransaction.encodedSignatures(),
      options
    )
  }
  else {
    console.log("Dispatch: Scheduling through timelock")
    txResponse = await contract.scheduleTransaction(
      safeTransaction.data.to,
      safeTransaction.data.value,
      safeTransaction.data.data,
      safeTransaction.data.operation,
      safeTransaction.data.safeTxGas,
      safeTransaction.data.baseGas,
      safeTransaction.data.gasPrice,
      safeTransaction.data.gasToken,
      safeTransaction.data.refundReceiver,
      safeTransaction.encodedSignatures(),
      options
    )
  }
  return toTxResult(txResponse, options)
}

export function toTxResult(
  transactionResponse: ContractTransaction,
  options?: TransactionOptions
): TransactionResult {
  return {
    hash: transactionResponse.hash,
    options,
    transactionResponse
  }
}

/**
 * Chase
 * From: https://github.com/safe-global/safe-core-sdk/blob/725f473aa7308b0e5748e7d2e08522645140dd52/packages/safe-core-sdk/src/utils/signatures/index.ts#L10
 * Should move this out later
 */
const _generatePreValidatedSignature = (ownerAddress: string): SafeSignature => {
  const signature =
    '0x000000000000000000000000' +
    ownerAddress.slice(2) +
    '0000000000000000000000000000000000000000000000000000000000000000' +
    '01'

  return new EthSignSignature(ownerAddress, signature)
}

/**
 * Chase
 * From: https://github.com/safe-global/safe-core-sdk/blob/725f473aa7308b0e5748e7d2e08522645140dd52/packages/safe-core-sdk/src/utils/signatures/SafeSignature.ts
 * Should move this out later
 */
class EthSignSignature implements SafeSignature {
  signer: string
  data: string

  /**
   * Creates an instance of a Safe signature.
   *
   * @param signer - Ethers signer
   * @param signature - The Safe signature
   * @returns The Safe signature instance
   */
  constructor(signer: string, signature: string) {
    this.signer = signer
    this.data = signature
  }

  /**
   * Returns the static part of the Safe signature.
   *
   * @returns The static part of the Safe signature
   */
  staticPart(/* dynamicOffset: number */) {
    return this.data
  }

  /**
   * Returns the dynamic part of the Safe signature.
   *
   * @returns The dynamic part of the Safe signature
   */
  dynamicPart() {
    return ''
  }
}

export const dispatchBatchExecution = async (
  txs: TransactionDetails[],
  multiSendContract: MultiSendCallOnlyEthersContract,
  multiSendTxData: string,
  onboard: OnboardAPI,
  chainId: SafeInfo['chainId'],
  safeAddress: string,
  overrides?: PayableOverrides,
) => {
  const groupKey = multiSendTxData

  let result: TransactionResult | undefined

  try {
    const wallet = await assertWalletChain(onboard, chainId)

    const provider = createWeb3(wallet.provider)
    result = await multiSendContract.contract.connect(provider.getSigner()).multiSend(multiSendTxData, overrides)

    txs.forEach(({ txId }) => {
      txDispatch(TxEvent.EXECUTING, { txId, groupKey })
    })
  } catch (err) {
    txs.forEach(({ txId }) => {
      txDispatch(TxEvent.FAILED, { txId, error: asError(err), groupKey })
    })
    throw err
  }

  txs.forEach(({ txId }) => {
    txDispatch(TxEvent.PROCESSING, { txId, txHash: result!.hash, groupKey })
  })

  result!.transactionResponse
    ?.wait()
    .then((receipt) => {
      if (didRevert(receipt)) {
        txs.forEach(({ txId }) => {
          txDispatch(TxEvent.REVERTED, {
            txId,
            error: new Error('Transaction reverted by EVM'),
            groupKey,
          })
        })
      } else {
        txs.forEach(({ txId }) => {
          txDispatch(TxEvent.PROCESSED, {
            txId,
            groupKey,
            safeAddress,
          })
        })
      }
    })
    .catch((err) => {
      const error = err as EthersError

      if (didReprice(error)) {
        txs.forEach(({ txId }) => {
          txDispatch(TxEvent.PROCESSED, {
            txId,
            safeAddress,
          })
        })
      } else {
        txs.forEach(({ txId }) => {
          txDispatch(TxEvent.FAILED, {
            txId,
            error: asError(err),
            groupKey,
          })
        })
      }
    })

  return result!.hash
}

export const dispatchSpendingLimitTxExecution = async (
  txParams: SpendingLimitTxParams,
  txOptions: TransactionOptions,
  onboard: OnboardAPI,
  chainId: SafeInfo['chainId'],
  safeAddress: string,
) => {
  const id = JSON.stringify(txParams)

  let result: ContractTransaction | undefined
  try {
    const wallet = await assertWalletChain(onboard, chainId)
    const provider = createWeb3(wallet.provider)
    const contract = getSpendingLimitContract(chainId, provider.getSigner())

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
      if (didRevert(receipt)) {
        txDispatch(TxEvent.REVERTED, {
          groupKey: id,
          error: new Error('Transaction reverted by EVM'),
        })
      } else {
        txDispatch(TxEvent.PROCESSED, { groupKey: id, safeAddress })
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
  onboard: OnboardAPI,
  chainId: SafeInfo['chainId'],
  txId?: string,
): Promise<string> => {
  const sdk = await getSafeSDKWithSigner(onboard, chainId)
  const safeTxHash = await sdk.getTransactionHash(safeTx)
  txDispatch(TxEvent.SAFE_APPS_REQUEST, { safeAppRequestId, safeTxHash, txId })
  return safeTxHash
}

export const dispatchTxRelay = async (
  safeTx: SafeTransaction,
  safe: SafeInfo,
  txId: string,
  gasLimit?: string | number,
) => {
  const readOnlySafeContract = getReadOnlyCurrentGnosisSafeContract(safe)

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
    const relayResponse = await sponsoredCall({ chainId: safe.chainId, to: safe.address.value, data, gasLimit })
    const taskId = relayResponse.taskId

    if (!taskId) {
      throw new Error('Transaction could not be relayed')
    }

    txDispatch(TxEvent.RELAYING, { taskId, txId })

    // Monitor relay tx
    waitForRelayedTx(taskId, [txId], safe.address.value)
  } catch (error) {
    txDispatch(TxEvent.FAILED, { txId, error: asError(error) })
    throw error
  }
}

export const dispatchBatchExecutionRelay = async (
  txs: TransactionDetails[],
  multiSendContract: MultiSendCallOnlyEthersContract,
  multiSendTxData: string,
  chainId: string,
  safeAddress: string,
) => {
  const to = multiSendContract.getAddress()
  const data = multiSendContract.contract.interface.encodeFunctionData('multiSend', [multiSendTxData])
  const groupKey = multiSendTxData

  let relayResponse
  try {
    relayResponse = await sponsoredCall({
      chainId,
      to,
      data,
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
  txs.forEach(({ txId }) => {
    txDispatch(TxEvent.RELAYING, { taskId, txId, groupKey })
  })

  // Monitor relay tx
  waitForRelayedTx(
    taskId,
    txs.map((tx) => tx.txId),
    safeAddress,
    groupKey,
  )
}
