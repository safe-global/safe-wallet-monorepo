import type {
  SafeTransaction,
  TransactionOptions,
  TransactionResult,
  SafeSignature,
} from '@safe-global/safe-core-sdk-types'
import type { ContractTransaction } from 'ethers'

// From Chase
import type Safe from '@safe-global/safe-core-sdk'
import { BigNumber } from '@ethersproject/bignumber'
import { ethers } from 'ethers'
import { MultisigConfirmation } from '@safe-global/safe-apps-sdk'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'

/**
 * Author: Chase
 * From: https://github.com/safe-global/safe-core-sdk/blob/725f473aa7308b0e5748e7d2e08522645140dd52/packages/safe-core-sdk/src/Safe.ts#L855
 * @param safeTransaction
 * @param isScheduled true if the transaction has already been scheduled in the timelock. false otherwise
 * @param options
 * @returns
 */
export const scheduleTransaction = (
  sdk: Safe,
  safeTransaction: SafeTransaction,
  options?: TransactionOptions,
): Promise<TransactionResult> => {
  return _timelockedTransaction(sdk, safeTransaction, false, options)
}

export const executeTransaction = (
  sdk: Safe,
  safeTransaction: SafeTransaction,
  options?: TransactionOptions,
): Promise<TransactionResult> => {
  return _timelockedTransaction(sdk, safeTransaction, true, options)
}

// might want to move this function later
// for now will just assume native transfers
export const getProposalId = (
  safeAdd: string,
  to: string,
  value: string,
  operation: number,
  safeTxGas: string,
  baseGas: string,
  gasPrice: string,
  gasToken: string,
  refundReceiver: string,
  signatures: MultisigConfirmation[],
): string => {
  const iface = new ethers.utils.Interface([
    // 'function execTransaction(address,uint256,bytes,uint8,uint256,uint256,uint256,address,address,bytes)',
    'function execTransaction(address to, uint256 value, bytes calldata data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures) public payable virtual returns (bool success)',
  ])
  console.log('Encoded sigs: ', _getEncodedSignatures(signatures))
  console.log(value)
  const callEncoding = iface.encodeFunctionData('execTransaction', [
    // encode exec transaction data
    to,
    value,
    '0x', // data is empty since it's just a transfer
    operation,
    safeTxGas,
    baseGas,
    gasPrice,
    gasToken,
    refundReceiver,
    _getEncodedSignatures(signatures),
  ])
  console.log('Call: ', callEncoding)
  const abi = new ethers.utils.AbiCoder()
  const abiEncode = abi.encode(
    ['address', 'uint256', 'bytes', 'bytes32', 'bytes32'],
    [safeAdd, 0, callEncoding, '0x' + '00'.repeat(32), '0x' + '00'.repeat(32)],
  ) // fill out
  const hashID = ethers.utils.keccak256(abiEncode)
  console.log('Abi Encoding: ', abiEncode)
  console.log('HashID: ', hashID)
  /*
0x6a7612020000000000000000000000001b6967bc7868f5a0cb78971427ef75ee4f8ee1c8000000000000000000000000000000000000000000000000002386f26fc1000000000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000826d34bbc5c202c1c6731ee74c630cbfb3723dd3b6193d2f71c02b83448ea4c87e4e996a46930eb30fd66321b714a76848ffab35b8b2cad011fe05a584df1c9bcf1b0dd21606b04a1608c34b73cde395ae0046ab4cc09693186b1e99027d96ee2a52155c7d336538e4861d4951a44a948f98d25c0a6b8345737012ba7eec721f81151c000000000000000000000000000000000000000000000000000000000000
  */
  return hashID
}

function _getEncodedSignatures(signatures: MultisigConfirmation[]) {
  let formattedSignatures: Record<string, string> = {}
  for (const sig of signatures) {
    if (sig.signature) formattedSignatures[sig.signer.value] = sig.signature
  }

  const signers = Object.keys(formattedSignatures).sort()
  let sig = ''
  signers.forEach((signerAddress) => {
    const signature = formattedSignatures[signerAddress]
    sig += signature.slice(2)
  })
  return '0x' + sig
}

async function _timelockedTransaction(
  sdk: Safe,
  safeTransaction: SafeTransaction,
  isScheduled: boolean,
  options?: TransactionOptions,
): Promise<TransactionResult> {
  let transaction = safeTransaction

  const signedSafeTransaction = await sdk.copyTransaction(transaction)

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
      `There ${signaturesMissing > 1 ? 'are' : 'is'} ${signaturesMissing} signature${
        signaturesMissing > 1 ? 's' : ''
      } missing`,
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

  const ethad: any = sdk.getEthAdapter() // the type here is restrictive, and so doesn't let me access the signer, even though it should be available

  const add = await findModuleAddress(sdk)

  const txResponse = await _scheduleTransactionContract(ethad.getSigner(), add, signedSafeTransaction, isScheduled, {
    from: signerAddress,
    ...options,
  })
  return txResponse
}

// from: https://github.com/safe-global/safe-core-sdk/blob/725f473aa7308b0e5748e7d2e08522645140dd52/packages/safe-ethers-lib/src/contracts/GnosisSafe/GnosisSafeContractEthers.ts#L130
const _scheduleTransactionContract = async (
  signer: any, // we can type the signer later
  modAddress: string,
  safeTransaction: SafeTransaction,
  isScheduled: boolean,
  options?: TransactionOptions,
): Promise<TransactionResult> => {
  // const address = "0x9045781E1E982198BEd965EB3cED7b2D1EC8baa2";
  // const inter: ethers.ContractInterface = JSON.parse(`[
  //     {
  //       "inputs": [
  //         {
  //           "internalType": "address",
  //           "name": "to",
  //           "type": "address"
  //         },
  //         {
  //           "internalType": "uint256",
  //           "name": "value",
  //           "type": "uint256"
  //         },
  //         {
  //           "internalType": "bytes",
  //           "name": "data",
  //           "type": "bytes"
  //         },
  //         {
  //           "internalType": "enum Enum.Operation",
  //           "name": "operation",
  //           "type": "uint8"
  //         },
  //         {
  //           "internalType": "uint256",
  //           "name": "safeTxGas",
  //           "type": "uint256"
  //         },
  //         {
  //           "internalType": "uint256",
  //           "name": "baseGas",
  //           "type": "uint256"
  //         },
  //         {
  //           "internalType": "uint256",
  //           "name": "gasPrice",
  //           "type": "uint256"
  //         },
  //         {
  //           "internalType": "address",
  //           "name": "gasToken",
  //           "type": "address"
  //         },
  //         {
  //           "internalType": "address payable",
  //           "name": "refundReceiver",
  //           "type": "address"
  //         },
  //         {
  //           "internalType": "bytes",
  //           "name": "signatures",
  //           "type": "bytes"
  //         }
  //       ],
  //       "name": "scheduleTransaction",
  //       "outputs": [
  //         {
  //           "internalType": "bytes32",
  //           "name": "",
  //           "type": "bytes32"
  //         }
  //       ],
  //       "stateMutability": "payable",
  //       "type": "function"
  //     },
  //     {
  //       "inputs": [
  //         {
  //           "internalType": "address",
  //           "name": "to",
  //           "type": "address"
  //         },
  //         {
  //           "internalType": "uint256",
  //           "name": "value",
  //           "type": "uint256"
  //         },
  //         {
  //           "internalType": "bytes",
  //           "name": "data",
  //           "type": "bytes"
  //         },
  //         {
  //           "internalType": "enum Enum.Operation",
  //           "name": "operation",
  //           "type": "uint8"
  //         },
  //         {
  //           "internalType": "uint256",
  //           "name": "safeTxGas",
  //           "type": "uint256"
  //         },
  //         {
  //           "internalType": "uint256",
  //           "name": "baseGas",
  //           "type": "uint256"
  //         },
  //         {
  //           "internalType": "uint256",
  //           "name": "gasPrice",
  //           "type": "uint256"
  //         },
  //         {
  //           "internalType": "address",
  //           "name": "gasToken",
  //           "type": "address"
  //         },
  //         {
  //           "internalType": "address payable",
  //           "name": "refundReceiver",
  //           "type": "address"
  //         },
  //         {
  //           "internalType": "bytes",
  //           "name": "signatures",
  //           "type": "bytes"
  //         }
  //       ],
  //       "stateMutability": "payable",
  //       "type": "function",
  //       "name": "executeTimelockTransaction"
  //     }]`);

  const inter: ethers.ContractInterface = require('./contracts/hsgsupermod.abi.json')

  if (signer) {
    console.log('Signer: ', signer)
  } else {
    console.error("Signer doesn't exist!")
    throw 'No signer'
  }
  const contract = new ethers.Contract(modAddress, inter, signer)

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
    // options.gasLimit = 300_000;
    options.gasLimit = (
      await (isScheduled
        ? contract.estimateGas.executeTimelockTransaction(
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
            options,
          )
        : contract.estimateGas.scheduleTransaction(
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
            options,
          ))
    ).toNumber()
    console.log('gaslimit: ', options.gasLimit)
  }

  let txResponse: ContractTransaction
  console.log('Proposed transaction: ', safeTransaction)
  if (isScheduled) {
    console.log('Dispatch: Executing through timelock')
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
      options,
    )
  } else {
    console.log('Dispatch: Scheduling through timelock')
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
      options,
    )
  }
  return toTxResult(txResponse, options)
}

export async function findModuleAddress(sdk: Safe): Promise<string> {
  const mods = await sdk.getModules()
  console.log('hsgsuper.ts:305; mods: ', mods)
  return mods[0] // hsgsuper prevents any other mods from being added to the safe
}

function toTxResult(transactionResponse: ContractTransaction, options?: TransactionOptions): TransactionResult {
  return {
    hash: transactionResponse.hash,
    options,
    transactionResponse,
  }
}
