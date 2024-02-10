import type { SafeTransaction, TransactionOptions, TransactionResult, SafeSignature } from '@safe-global/safe-core-sdk-types'
import type { ContractTransaction } from 'ethers'

// From Chase
import type Safe from '@safe-global/safe-core-sdk'
import { BigNumber } from '@ethersproject/bignumber'
import EthersAdapter from '@safe-global/safe-ethers-lib'
import { ethers } from 'ethers';

/**
 * Author: Chase
 * From: https://github.com/safe-global/safe-core-sdk/blob/725f473aa7308b0e5748e7d2e08522645140dd52/packages/safe-core-sdk/src/Safe.ts#L855
 * @param safeTransaction 
 * @param isScheduled true if the transaction has already been scheduled in the timelock. false otherwise
 * @param options 
 * @returns 
 */
export const _scheduleTransaction = async (
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

  const ethad: any = sdk.getEthAdapter() // the type here is restrictive, and so doesn't let me access the signer, even though it should be available

  const txResponse = await _scheduleTransactionContract(
    ethad.getSigner(),
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
  signer: any, // we can type the signer later
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
  // let metamask: ethers.providers.ExternalProvider;
  // if (window.ethereum)
  //     metamask = window.ethereum
  // else {
  //     console.log("Metamask not available");
  //     throw "Metamask not available"
  // }

  // const provider = new ethers.providers.Web3Provider(metamask)

  // // MetaMask requires requesting permission to connect users accounts
  // await provider.send("eth_requestAccounts", []);

  // // The MetaMask plugin also allows signing transactions to
  // // send ether and pay to change state within the blockchain.
  // // For this, you need the account signer...
  // const signerTwo = provider.getSigner()

  if (signer) {
    console.log("Signer: ", signer);
  }
  else {
    console.error("Signer doesn't exist!")
    throw "No signer"
  }
  const contract = new ethers.Contract(address, inter, signer);
  let txResponse: ContractTransaction
  console.log("Proposed transaction: ", safeTransaction)
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