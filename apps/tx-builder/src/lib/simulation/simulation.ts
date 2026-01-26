import axios from 'axios'
import { Interface } from 'ethers'
import { BaseTransaction } from '@safe-global/safe-apps-sdk'

import { TenderlySimulatePayload, TenderlySimulation, StateObject } from './types'
import { encodeMultiSendCall, getMultiSendCallOnlyAddress } from './multisend'
import { getChainConfig, FEATURES } from '@safe-global/safe-gateway-typescript-sdk'

type OptionalExceptFor<T, TRequired extends keyof T = keyof T> = Partial<Pick<T, Exclude<keyof T, TRequired>>> &
  Required<Pick<T, TRequired>>

// api docs: https://www.notion.so/Simulate-API-Documentation-6f7009fe6d1a48c999ffeb7941efc104
const TENDERLY_SIMULATE_ENDPOINT_URL = import.meta.env.VITE_TENDERLY_SIMULATE_ENDPOINT_URL || ''
const TENDERLY_PROJECT_NAME = import.meta.env.VITE_TENDERLY_PROJECT_NAME || ''
const TENDERLY_ORG_NAME = import.meta.env.VITE_TENDERLY_ORG_NAME || ''

const isSimulationSupported = async (chainId: string) => {
  const config = await getChainConfig(chainId)
  return config.features.includes(FEATURES.TX_SIMULATION)
}

const getSimulation = async (tx: TenderlySimulatePayload): Promise<TenderlySimulation> => {
  const response = await axios.post<TenderlySimulation>(TENDERLY_SIMULATE_ENDPOINT_URL, tx)

  return response.data
}

const getSimulationLink = (simulationId: string): string => {
  return `https://dashboard.tenderly.co/public/${TENDERLY_ORG_NAME}/${TENDERLY_PROJECT_NAME}/simulator/${simulationId}`
}

/* We need to overwrite the threshold stored in smart contract storage to 1
 to do a proper simulation that takes transaction guards into account.
 The threshold is stored in storage slot 4 and uses full 32 bytes slot
 Safe storage layout can be found here:
 https://github.com/gnosis/safe-contracts/blob/main/contracts/libraries/GnosisSafeStorage.sol */
const THRESHOLD_ONE_STORAGE_OVERRIDE = {
  [`0x${'4'.padStart(64, '0')}`]: `0x${'1'.padStart(64, '0')}`,
}

const getStateOverride = (
  address: string,
  balance?: string,
  code?: string,
  storage?: Record<string, string>,
): Record<string, StateObject> => ({
  [address]: {
    balance,
    code,
    storage,
  },
})

interface SafeTransaction {
  to: string
  value: string
  data: string
  safeTxGas: string
  baseGas: string
  gasPrice: string
  gasToken: string
  refundReceiver: string
  nonce: string
  operation: string
}

interface SignedSafeTransaction extends SafeTransaction {
  signatures: string
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const EXEC_TRANSACTION_ABI = [
  {
    name: 'execTransaction',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'bytes' },
      { name: 'operation', type: 'uint8' },
      { name: 'safeTxGas', type: 'uint256' },
      { name: 'baseGas', type: 'uint256' },
      { name: 'gasPrice', type: 'uint256' },
      { name: 'gasToken', type: 'address' },
      { name: 'refundReceiver', type: 'address' },
      { name: 'signatures', type: 'bytes' },
    ],
  },
]

const buildSafeTransaction = (template: OptionalExceptFor<SafeTransaction, 'to' | 'nonce'>): SafeTransaction => {
  return {
    to: template.to,
    value: template.value || '0',
    data: template.data || '0x',
    operation: template.operation || '0',
    safeTxGas: template.safeTxGas || '0',
    baseGas: template.baseGas || '0',
    gasPrice: template.gasPrice || '0',
    gasToken: template.gasToken || ZERO_ADDRESS,
    refundReceiver: template.refundReceiver || ZERO_ADDRESS,
    nonce: template.nonce,
  }
}

const encodeSafeExecuteTransactionCall = (tx: SignedSafeTransaction): string => {
  const iface = new Interface(EXEC_TRANSACTION_ABI)

  const encodedSafeExecuteTransactionCall = iface.encodeFunctionData('execTransaction', [
    tx.to,
    tx.value,
    tx.data,
    tx.operation,
    tx.safeTxGas,
    tx.baseGas,
    tx.gasPrice,
    tx.gasToken,
    tx.refundReceiver,
    tx.signatures,
  ])

  return encodedSafeExecuteTransactionCall
}

const getPreValidatedSignature = (address: string): string => {
  return `0x000000000000000000000000${address.replace(
    '0x',
    '',
  )}000000000000000000000000000000000000000000000000000000000000000001`
}

type SimulationTxParams = {
  safeAddress: string
  safeNonce: string
  executionOwner: string
  transactions: BaseTransaction[]
  chainId: string
  gasLimit: number
}

const getSingleTransactionExecutionData = (tx: SimulationTxParams): string => {
  const safeTransaction = buildSafeTransaction({
    to: tx.transactions[0].to,
    value: tx.transactions[0].value,
    data: tx.transactions[0].data,
    nonce: tx.safeNonce,
    operation: '0',
  })
  const signedSafeTransaction: SignedSafeTransaction = {
    ...safeTransaction,
    signatures: getPreValidatedSignature(tx.executionOwner),
  }

  const executionTransactionData = encodeSafeExecuteTransactionCall(signedSafeTransaction)

  return executionTransactionData
}

const getMultiSendExecutionData = (tx: SimulationTxParams): string => {
  const safeTransactionData = encodeMultiSendCall(tx.transactions)
  const multiSendAddress = getMultiSendCallOnlyAddress(tx.chainId)
  const safeTransaction = buildSafeTransaction({
    to: multiSendAddress,
    value: '0',
    data: safeTransactionData,
    nonce: tx.safeNonce,
    operation: '1',
  })
  const signedSafeTransaction: SignedSafeTransaction = {
    ...safeTransaction,
    signatures: getPreValidatedSignature(tx.executionOwner),
  }

  const executionTransactionData = encodeSafeExecuteTransactionCall(signedSafeTransaction)

  return executionTransactionData
}

const getSimulationPayload = (tx: SimulationTxParams): TenderlySimulatePayload => {
  // we need separate functions for encoding single and multi send transactions because
  // if there's only 1 transaction in the batch, the Safe interface doesn't route it through the multisend contract
  // instead it directly calls the contract in the batch transaction
  const executionData =
    tx.transactions.length === 1 ? getSingleTransactionExecutionData(tx) : getMultiSendExecutionData(tx)

  const safeThresholdStateOverride = getStateOverride(
    tx.safeAddress,
    undefined,
    undefined,
    THRESHOLD_ONE_STORAGE_OVERRIDE,
  )

  return {
    network_id: tx.chainId,
    from: tx.executionOwner,
    to: tx.safeAddress,
    input: executionData,
    gas: tx.gasLimit,
    // with gas price 0 account don't need token for gas
    gas_price: '0',
    state_objects: {
      ...safeThresholdStateOverride,
    },
    save: true,
    save_if_fails: true,
  }
}

export { getSimulationLink, getSimulation, getSimulationPayload, isSimulationSupported }
