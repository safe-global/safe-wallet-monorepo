import type { ChainInfo, SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { MetaTransactionData, SafeTransaction } from '@safe-global/types-kit'
import {
  TENDERLY_ORG_NAME,
  TENDERLY_PROJECT_NAME,
  TENDERLY_SIMULATE_ENDPOINT_URL,
} from '@safe-global/utils/config/constants'
import { FEATURES, hasFeature } from '@safe-global/utils/utils/chains'
import type {
  StateObject,
  TenderlySimulatePayload,
  TenderlySimulation,
} from '@safe-global/utils/components/tx/security/tenderly/types'
import type { EnvState } from '@safe-global/store/settingsSlice'
import { toBeHex, ZeroAddress } from 'ethers'

export const getSimulationLink = (simulationId: string): string => {
  return `https://dashboard.tenderly.co/public/${TENDERLY_ORG_NAME}/${TENDERLY_PROJECT_NAME}/simulator/${simulationId}`
}

export type SingleTransactionSimulationParams = {
  safe: SafeInfo
  executionOwner: string
  transactions: SafeTransaction
  gasLimit?: number
}
export type MultiSendTransactionSimulationParams = {
  safe: SafeInfo
  executionOwner: string
  transactions: MetaTransactionData[]
  gasLimit?: number
}
export type SimulationTxParams = SingleTransactionSimulationParams | MultiSendTransactionSimulationParams
export const isTxSimulationEnabled = (chain?: Pick<Chain, 'features'>): boolean => {
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
} /* We need to overwrite the nonce if we simulate a (partially) signed transaction which is not at the top position of the tx queue.
  The nonce can be found in storage slot 5 and uses a full 32 bytes slot. */
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
export const isSingleTransactionSimulation = (
  params: SimulationTxParams,
): params is SingleTransactionSimulationParams => {
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
const getGuardOverwrite = (params: SimulationTxParams): string | undefined => {
  const hasGuard = params.safe.guard?.value !== undefined && params.safe.guard.value !== ZeroAddress
  if (hasGuard) {
    return ZeroAddress
  }
}
/* We need to overwrite the threshold stored in smart contract storage to 1
  to do a proper simulation that takes transaction guards into account.
  The threshold is stored in storage slot 4 and uses full 32 bytes slot.
  Safe storage layout can be found here:
  https://github.com/gnosis/safe-contracts/blob/main/contracts/libraries/SafeStorage.sol */
export const THRESHOLD_STORAGE_POSITION = toBeHex('0x4', 32)
export const THRESHOLD_OVERWRITE = toBeHex('0x1', 32)
export const NONCE_STORAGE_POSITION = toBeHex('0x5', 32)
/** keccak256("guard_manager.guard.address" */
export const GUARD_STORAGE_POSITION = '0x4a204f620c8c5ccdca3fd54d003badd85ba500436a431f0cbda4f558c93c34c8'

export const getStateOverwrites = (params: SimulationTxParams) => {
  const nonceOverwrite = getNonceOverwrite(params)
  const isThresholdOverwrite = isOverwriteThreshold(params)
  const guardOverwrite = getGuardOverwrite(params)
  const storageOverwrites: Record<string, string> = {} as Record<string, string>

  if (isThresholdOverwrite) {
    storageOverwrites[THRESHOLD_STORAGE_POSITION] = THRESHOLD_OVERWRITE
  }
  if (nonceOverwrite !== undefined) {
    storageOverwrites[NONCE_STORAGE_POSITION] = toBeHex('0x' + BigInt(nonceOverwrite).toString(16), 32)
  }
  if (guardOverwrite !== undefined) {
    storageOverwrites[GUARD_STORAGE_POSITION] = toBeHex(guardOverwrite, 32)
  }

  return storageOverwrites
}
