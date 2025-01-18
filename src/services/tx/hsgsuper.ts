import type { SafeTransaction, TransactionOptions, TransactionResult } from '@safe-global/safe-core-sdk-types'
import type { ContractTransaction, Signer } from 'ethers'

// From Chase
import Safe from '@safe-global/safe-core-sdk'
import { BigNumber } from '@ethersproject/bignumber'
import { ethers } from 'ethers'
import type { Web3Provider } from '@ethersproject/providers'
import type { MultisigConfirmation } from '@safe-global/safe-apps-sdk'
import { getWeb3ReadOnly } from '@/hooks/wallets/web3'
import { HsgsupermodAbi__factory as HsgsupermodFactory } from 'src/types/contracts/hsgsuper/factories/HsgsupermodAbi__factory'
import type { HsgsupermodAbi as HsgSuperContract } from '@/types/contracts/hsgsuper/HsgsupermodAbi'
import { createEthersAdapter } from '@/hooks/coreSDK/safeCoreSDK'

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
  data: string | null,
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

  const callEncoding = iface.encodeFunctionData('execTransaction', [
    // encode exec transaction data
    to,
    value,
    data ?? '0x', // data is empty since it's just a transfer
    operation,
    safeTxGas,
    baseGas,
    gasPrice,
    gasToken,
    refundReceiver,
    _getEncodedSignatures(signatures),
  ])

  const abi = new ethers.utils.AbiCoder()
  const abiEncode = abi.encode(
    ['address', 'uint256', 'bytes', 'bytes32', 'bytes32'],
    [safeAdd, 0, callEncoding, '0x' + '00'.repeat(32), '0x' + '00'.repeat(32)],
  ) // fill out
  const hashID = ethers.utils.keccak256(abiEncode)

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
  const inter: ethers.ContractInterface = require('./contracts/hsgsupermod.abi.json')

  if (signer) {
  } else {
    console.error("Signer doesn't exist!")
    throw 'No signer'
  }
  const contract = new ethers.Contract(modAddress, inter, signer)

  if (options && !options.gasLimit) {
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
  }

  let txResponse: ContractTransaction

  if (isScheduled) {
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

  return mods[0] // hsgsuper prevents any other mods from being added to the safe
}

export async function getHsgSuperContract(sdk: Safe, signer?: Signer): Promise<HsgSuperContract> {
  const modAdd = await findModuleAddress(sdk)
  const provider = getWeb3ReadOnly()
  if (!signer && !provider) {
    throw 'No signer or provider'
  }

  return HsgsupermodFactory.connect(modAdd, signer ?? (provider as ethers.providers.Provider))
}

function toTxResult(transactionResponse: ContractTransaction, options?: TransactionOptions): TransactionResult {
  return {
    hash: transactionResponse.hash,
    options,
    transactionResponse,
  }
}

export enum ClaimSignerError {
  NoSigner = 'No signer',
  Revert = 'Contract call reverted',
  GasError = 'Cannot estimate gas',
}

export const claimSigner = async (
  web3Provider: Web3Provider | undefined, // we can type the signer later
  safeAddress: string,
  options: TransactionOptions = {},
): Promise<TransactionResult | undefined> => {
  if (!web3Provider) {
    console.log('hsgsuper: no web3Provider')
    return
  }
  const ethersAdapter = createEthersAdapter(web3Provider)
  const signer = ethersAdapter.getSigner()
  if (!signer) {
    console.error("Signer doesn't exist!")
    throw ClaimSignerError.NoSigner
  }

  // const _safe = new Safe()
  const safe = await Safe.create({
    ethAdapter: ethersAdapter,
    safeAddress,
    isL1SafeMasterCopy: true,
  })

  const hsgsuperAdd = await findModuleAddress(safe)

  const contract = HsgsupermodFactory.connect(hsgsuperAdd, signer)
  if (!options.gasLimit) {
    options.gasLimit = (
      await contract.estimateGas.claimSigner().catch((err) => {
        if ((err.message as string).includes('"message":"execution reverted"')) {
          throw ClaimSignerError.Revert
        } else {
          throw ClaimSignerError.GasError
        }
      })
    ).toNumber()
  }

  const txResponse = await contract.claimSigner()
  return toTxResult(txResponse, options)
}
