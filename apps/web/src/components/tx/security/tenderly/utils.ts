import { generatePreValidatedSignature } from '@safe-global/protocol-kit/dist/src/utils/signatures'
import EthSafeTransaction from '@safe-global/protocol-kit/dist/src/utils/transactions/SafeTransaction'
import { encodeMultiSendData } from '@safe-global/protocol-kit/dist/src/utils/transactions/utils'
import { type SafeInfo, type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { MetaTransactionData, SafeTransaction } from '@safe-global/safe-core-sdk-types'

import {
  getReadOnlyMultiSendCallOnlyContract,
  getReadOnlyCurrentGnosisSafeContract,
} from '@/services/contracts/safeContracts'
import { FEATURES, hasFeature } from '@/utils/chains'
import type { StateObject, TenderlySimulatePayload, TenderlySimulation } from '@/components/tx/security/tenderly/types'
import { getWeb3ReadOnly } from '@/hooks/wallets/web3'
import { toBeHex } from 'ethers'
import type { EnvState } from '@/store/settingsSlice'
import {
  TENDERLY_ORG_NAME,
  TENDERLY_PROJECT_NAME,
  TENDERLY_SIMULATE_ENDPOINT_URL,
} from '@safe-global/utils/config/constants'

export const isTxSimulationEnabled = (chain?: ChainInfo): boolean => {
  if (!chain) {
    return false
  }

  const isSimulationEnvSet =
    Boolean(TENDERLY_SIMULATE_ENDPOINT_URL) && Boolean(TENDERLY_ORG_NAME) && Boolean(TENDERLY_PROJECT_NAME)

  return isSimulationEnvSet && hasFeature(chain, FEATURES.TX_SIMULATION)
}

export const getSimulation = async (
  tx: TenderlySimulatePayload,
  customTenderly: EnvState['tenderly'] | undefined,
): Promise<TenderlySimulation> => {
  const requestObject: RequestInit = {
    method: 'POST',
    body: JSON.stringify(tx),
  }

  if (customTenderly?.accessToken) {
    requestObject.headers = {
      'content-type': 'application/JSON',
      'X-Access-Key': customTenderly.accessToken,
    }
  }

  const data = await fetch(
    customTenderly?.url ? customTenderly.url : TENDERLY_SIMULATE_ENDPOINT_URL,
    requestObject,
  ).then((res) => {
    if (res.ok) {
      return res.json()
    }
    return res.json().then((data) => {
      throw new Error(`${res.status} - ${res.statusText}: ${data?.error?.message}`)
    })
  })

  return data as TenderlySimulation
}

export const getSimulationLink = (simulationId: string): string => {
  return `https://dashboard.tenderly.co/public/${TENDERLY_ORG_NAME}/${TENDERLY_PROJECT_NAME}/simulator/${simulationId}`
}

type SingleTransactionSimulationParams = {
  safe: SafeInfo
  executionOwner: string
  transactions: SafeTransaction
  gasLimit?: number
}

type MultiSendTransactionSimulationParams = {
  safe: SafeInfo
  executionOwner: string
  transactions: MetaTransactionData[]
  gasLimit?: number
}

export type SimulationTxParams = SingleTransactionSimulationParams | MultiSendTransactionSimulationParams

export const _getSingleTransactionPayload = async (
  params: SingleTransactionSimulationParams,
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

export const _getStateOverride = (
  address: string,
  balance?: string,
  code?: string,
  storage?: Record<string, string>,
): Record<string, StateObject> => {
  return {
    [address]: {
      balance,
      code,
      storage,
    },
  }
}

const isSingleTransactionSimulation = (params: SimulationTxParams): params is SingleTransactionSimulationParams => {
  return !Array.isArray(params.transactions)
}

/**
 * @returns true for single MultiSig transactions if the provided signatures plus the current owner's signature (if missing)
 * do not reach the safe's threshold.
 */
const isOverwriteThreshold = (params: SimulationTxParams) => {
  if (!isSingleTransactionSimulation(params)) {
    return false
  }
  const tx = params.transactions
  const hasOwnerSig = tx.signatures.has(params.executionOwner)
  const effectiveSigs = tx.signatures.size + (hasOwnerSig ? 0 : 1)
  return params.safe.threshold > effectiveSigs
}

const getNonceOverwrite = (params: SimulationTxParams): number | undefined => {
  if (!isSingleTransactionSimulation(params)) {
    return
  }
  const txNonce = params.transactions.data.nonce
  const safeNonce = params.safe.nonce
  if (txNonce > safeNonce) {
    return txNonce
  }
}

/* We need to overwrite the threshold stored in smart contract storage to 1
  to do a proper simulation that takes transaction guards into account.
  The threshold is stored in storage slot 4 and uses full 32 bytes slot.
  Safe storage layout can be found here:
  https://github.com/gnosis/safe-contracts/blob/main/contracts/libraries/GnosisSafeStorage.sol */
export const THRESHOLD_STORAGE_POSITION = toBeHex('0x4', 32)
export const THRESHOLD_OVERWRITE = toBeHex('0x1', 32)
/* We need to overwrite the nonce if we simulate a (partially) signed transaction which is not at the top position of the tx queue.
  The nonce can be found in storage slot 5 and uses a full 32 bytes slot. */
export const NONCE_STORAGE_POSITION = toBeHex('0x5', 32)

const getStateOverwrites = (params: SimulationTxParams) => {
  const nonceOverwrite = getNonceOverwrite(params)
  const isThresholdOverwrite = isOverwriteThreshold(params)

  const storageOverwrites: Record<string, string> = {} as Record<string, string>

  if (isThresholdOverwrite) {
    storageOverwrites[THRESHOLD_STORAGE_POSITION] = THRESHOLD_OVERWRITE
  }
  if (nonceOverwrite !== undefined) {
    storageOverwrites[NONCE_STORAGE_POSITION] = toBeHex('0x' + BigInt(nonceOverwrite).toString(16), 32)
  }

  return storageOverwrites
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
