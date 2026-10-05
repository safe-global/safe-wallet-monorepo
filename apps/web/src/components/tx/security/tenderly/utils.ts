import { generatePreValidatedSignature } from '@safe-global/protocol-kit'
import { EthSafeTransaction, encodeMultiSendData } from '@safe-global/protocol-kit'

import {
  getReadOnlyCurrentGnosisSafeContract,
  getReadOnlyMultiSendCallOnlyContract,
} from '@/services/contracts/safeContracts'
import type { TenderlySimulatePayload } from '@safe-global/utils/components/tx/security/tenderly/types'
import { getWeb3ReadOnly } from '@/hooks/wallets/web3ReadOnly'
import type { TxSenderScope } from '@/components/tx-flow/safe-scope/types'

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
  scope?: TxSenderScope,
): Promise<Pick<TenderlySimulatePayload, 'to' | 'input'>> => {
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

  const readOnlySafeContract = await getReadOnlyCurrentGnosisSafeContract(params.safe, scope)

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
    to: readOnlySafeContract.getAddress(),
    input,
  }
}

export const _getMultiSendCallOnlyPayload = async (
  params: MultiSendTransactionSimulationParams,
  scope?: TxSenderScope,
): Promise<Pick<TenderlySimulatePayload, 'to' | 'input'>> => {
  const data = encodeMultiSendData(params.transactions) as `0x${string}`
  const readOnlyMultiSendContract = await getReadOnlyMultiSendCallOnlyContract(
    params.safe.version,
    params.safe.chainId,
    params.safe.implementation?.value,
    scope,
  )

  return {
    to: readOnlyMultiSendContract.getAddress(),
    input: readOnlyMultiSendContract.encode('multiSend', [data]),
  }
}

const getLatestBlockGasLimit = async (scope?: TxSenderScope): Promise<number> => {
  // Falling back to the app-wide provider here would read the URL chain's block, not the scoped Safe's.
  if (scope && !scope.web3ReadOnly) {
    throw Error('The provider for the selected Safe account is not initialized yet.')
  }

  const web3ReadOnly = scope?.web3ReadOnly ?? getWeb3ReadOnly()
  const latestBlock = await web3ReadOnly?.getBlock('latest')
  if (!latestBlock) {
    throw Error('Could not determine block gas limit')
  }
  return Number(latestBlock.gasLimit)
}

export const getSimulationPayload = async (
  params: SimulationTxParams,
  scope?: TxSenderScope,
): Promise<TenderlySimulatePayload> => {
  const gasLimit = params.gasLimit ?? (await getLatestBlockGasLimit(scope))

  const payload = isSingleTransactionSimulation(params)
    ? await _getSingleTransactionPayload(params, scope)
    : await _getMultiSendCallOnlyPayload(params, scope)

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
