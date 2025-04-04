import { generatePreValidatedSignature } from '@safe-global/protocol-kit/dist/src/utils/signatures'
import EthSafeTransaction from '@safe-global/protocol-kit/dist/src/utils/transactions/SafeTransaction'
import { encodeMultiSendData } from '@safe-global/protocol-kit/dist/src/utils/transactions/utils'

import {
  getReadOnlyCurrentGnosisSafeContract,
  getReadOnlyMultiSendCallOnlyContract,
} from '@/src/services/contracts/safeContracts'
import type { TenderlySimulatePayload } from '@safe-global/utils/components/tx/security/tenderly/types'
import { getWeb3ReadOnly } from '@/src/hooks/wallets/web3'

import type {
  MultiSendTransactionSimulationParams,
  SimulationTxParams,
  SingleTransactionSimulationParams,
} from '@safe-global/utils/components/tx/security/tenderly/utils'
import {
  _getStateOverride,
  getStateOverwrites,
  isSingleTransactionSimulation,
} from '@safe-global/utils/components/tx/security/tenderly/utils'

export const _getSingleTransactionPayload = async (
  params: SingleTransactionSimulationParams,
): Promise<Pick<TenderlySimulatePayload, 'to' | 'input'>> => {
  console.log('single transaction payload', params)
  // If a transaction is executable we simulate with the proposed/selected gasLimit and the actual signatures
  let transaction = params.transactions
  const hasOwnerSignature = transaction.signatures.has(params.executionOwner)
  // If the owner's sig is missing and the tx threshold is not reached we add the owner's preValidated signature
  const needsOwnerSignature = !hasOwnerSignature && transaction.signatures.size < params.safe.threshold
  if (needsOwnerSignature) {
    const simulatedTransaction = new EthSafeTransaction(transaction.data)

    transaction.signatures.forEach((signature) => {
      simulatedTransaction.addSignature(signature)
    })
    simulatedTransaction.addSignature(generatePreValidatedSignature(params.executionOwner))

    transaction = simulatedTransaction
  }

  const readOnlySafeContract = await getReadOnlyCurrentGnosisSafeContract(params.safe)

  const input = readOnlySafeContract.encode('execTransaction', [
    transaction.data.to,
    transaction.data.value,
    transaction.data.data,
    transaction.data.operation,
    transaction.data.safeTxGas,
    transaction.data.baseGas,
    transaction.data.gasPrice,
    transaction.data.gasToken,
    transaction.data.refundReceiver,
    transaction.encodedSignatures(),
  ])

  return {
    to: await readOnlySafeContract.getAddress(),
    input,
  }
}

export const _getMultiSendCallOnlyPayload = async (
  params: MultiSendTransactionSimulationParams,
): Promise<Pick<TenderlySimulatePayload, 'to' | 'input'>> => {
  const data = encodeMultiSendData(params.transactions)
  const readOnlyMultiSendContract = await getReadOnlyMultiSendCallOnlyContract(params.safe.version)

  return {
    to: await readOnlyMultiSendContract.getAddress(),
    input: readOnlyMultiSendContract.encode('multiSend', [data]),
  }
}

const getLatestBlockGasLimit = async (): Promise<number> => {
  const web3ReadOnly = getWeb3ReadOnly()
  const latestBlock = await web3ReadOnly?.getBlock('latest')
  if (!latestBlock) {
    throw Error('Could not determine block gas limit')
  }
  return Number(latestBlock.gasLimit)
}

export const getSimulationPayload = async (params: SimulationTxParams): Promise<TenderlySimulatePayload> => {
  const gasLimit = params.gasLimit ?? (await getLatestBlockGasLimit())

  const payload = isSingleTransactionSimulation(params)
    ? await _getSingleTransactionPayload(params)
    : await _getMultiSendCallOnlyPayload(params)

  const stateOverwrites = getStateOverwrites(params)
  const stateOverwritesLength = Object.keys(stateOverwrites).length

  return {
    ...payload,
    network_id: params.safe.chainId,
    from: params.executionOwner,
    gas: gasLimit,
    // With gas price 0 account don't need token for gas
    gas_price: '0',
    state_objects:
      stateOverwritesLength > 0
        ? _getStateOverride(params.safe.address.value, undefined, undefined, stateOverwrites)
        : undefined,
    save: true,
    save_if_fails: true,
  }
}
