import { POLLING_INTERVAL } from '@/config/constants'
import type { PayMethod } from '@/features/counterfactual/PayNowPayLater'
import { safeCreationDispatch, SafeCreationEvent } from '@/features/counterfactual/services/safeCreationEvents'
import {
  addUndeployedSafe,
  type UndeployedSafeProps,
  type ReplayedSafeProps,
  type UndeployedSafe,
  PendingSafeStatus,
} from '@/features/counterfactual/store/undeployedSafesSlice'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { getWeb3ReadOnly } from '@/hooks/wallets/web3'
import { asError } from '@/services/exceptions/utils'
import { getSafeSDKWithSigner, getUncheckedSigner, tryOffChainTxSigning } from '@/services/tx/tx-sender/sdk'
import { getRelayTxStatus, TaskState } from '@/services/tx/txMonitor'
import type { AppDispatch } from '@/store'
import { defaultSafeInfo } from '@/store/safeInfoSlice'
import { didRevert, type EthersError } from '@/utils/ethers-utils'
import { assertProvider, assertTx, assertWallet } from '@/utils/helpers'
import { type DeploySafeProps, type PredictedSafeProps } from '@safe-global/protocol-kit'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import type { SafeTransaction, SafeVersion, TransactionOptions } from '@safe-global/safe-core-sdk-types'
import {
  type ChainInfo,
  ImplementationVersionState,
  type SafeBalanceResponse,
  TokenType,
} from '@safe-global/safe-gateway-typescript-sdk'
import type { BrowserProvider, ContractTransactionResponse, Eip1193Provider, Provider } from 'ethers'
import { getSafeL2SingletonDeployments, getSafeSingletonDeployments } from '@safe-global/safe-deployments'
import { sameAddress } from '@safe-global/utils/utils/addresses'

import { encodeSafeCreationTx } from '@/components/new-safe/create/logic'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'

export const getUndeployedSafeInfo = (undeployedSafe: UndeployedSafe, address: string, chain: ChainInfo) => {
  const safeSetup = extractCounterfactualSafeSetup(undeployedSafe, chain.chainId)

  if (!safeSetup) {
    throw Error('Could not determine Safe Setup.')
  }
  const latestSafeVersion = getLatestSafeVersion(chain)

  return {
    ...defaultSafeInfo,
    address: { value: address },
    chainId: chain.chainId,
    owners: safeSetup.owners.map((owner) => ({ value: owner })),
    nonce: 0,
    threshold: safeSetup.threshold,
    implementationVersionState: ImplementationVersionState.UP_TO_DATE,
    fallbackHandler: { value: safeSetup.fallbackHandler! },
    version: safeSetup?.safeVersion || latestSafeVersion,
    deployed: false,
  }
}

export const CF_TX_GROUP_KEY = 'cf-tx'

export const dispatchTxExecutionAndDeploySafe = async (
  safeTx: SafeTransaction,
  txOptions: TransactionOptions,
  provider: Eip1193Provider,
  safeAddress: string,
) => {
  const sdk = await getSafeSDKWithSigner(provider)
  const eventParams = { groupKey: CF_TX_GROUP_KEY }

  let result: ContractTransactionResponse | undefined
  try {
    const signedTx = await tryOffChainTxSigning(safeTx, sdk)
    const signer = await getUncheckedSigner(provider)

    const deploymentTx = await sdk.wrapSafeTransactionIntoDeploymentBatch(signedTx, txOptions)

    // We need to estimate the actual gasLimit after the user has signed since it is more accurate than what useDeployGasLimit returns
    const gas = await signer.estimateGas({ data: deploymentTx.data, value: deploymentTx.value, to: deploymentTx.to })

    // @ts-ignore TODO: Check why TransactionResponse type doesn't work
    result = await signer.sendTransaction({ ...deploymentTx, gasLimit: gas })
  } catch (error) {
    safeCreationDispatch(SafeCreationEvent.FAILED, { ...eventParams, error: asError(error), safeAddress })
    throw error
  }

  safeCreationDispatch(SafeCreationEvent.PROCESSING, { ...eventParams, txHash: result!.hash, safeAddress })

  return result!.hash
}

export const deploySafeAndExecuteTx = async (
  txOptions: TransactionOptions,
  wallet: ConnectedWallet | null,
  safeAddress: string,
  safeTx?: SafeTransaction,
  provider?: Eip1193Provider,
) => {
  assertTx(safeTx)
  assertWallet(wallet)
  assertProvider(provider)

  return dispatchTxExecutionAndDeploySafe(safeTx, txOptions, provider, safeAddress)
}

export const getCounterfactualBalance = async (safeAddress: string, provider?: BrowserProvider, chain?: ChainInfo) => {
  let balance: bigint | undefined

  if (!chain) return undefined

  // Fetch balance via the connected wallet.
  // If there is no wallet connected we fetch and cache the balance instead
  if (provider) {
    balance = await provider.getBalance(safeAddress)
  } else {
    balance = (await getWeb3ReadOnly()?.getBalance(safeAddress)) ?? 0n
  }

  return <SafeBalanceResponse>{
    fiatTotal: '0',
    items: [
      {
        tokenInfo: {
          type: TokenType.NATIVE_TOKEN,
          address: ZERO_ADDRESS,
          ...chain?.nativeCurrency,
        },
        balance: balance?.toString(),
        fiatBalance: '0',
        fiatConversion: '0',
      },
    ],
  }
}

export const replayCounterfactualSafeDeployment = (
  chainId: string,
  safeAddress: string,
  replayedSafeProps: ReplayedSafeProps,
  name: string,
  dispatch: AppDispatch,
  payMethod: PayMethod,
) => {
  const undeployedSafe = {
    chainId,
    address: safeAddress,
    type: payMethod,
    safeProps: replayedSafeProps,
  }

  const setup = extractCounterfactualSafeSetup(
    {
      props: replayedSafeProps,
      status: {
        status: PendingSafeStatus.AWAITING_EXECUTION,
        type: payMethod,
      },
    },
    chainId,
  )
  if (!setup) {
    throw Error('Safe Setup could not be decoded')
  }

  dispatch(addUndeployedSafe(undeployedSafe))
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Calling getTransaction too fast sometimes fails because the txHash hasn't been
 * picked up by any node yet so we should retry a few times with short delays to
 * make sure the transaction really does/does not exist
 * @param provider
 * @param txHash
 * @param maxAttempts
 */
async function retryGetTransaction(provider: Provider, txHash: string, maxAttempts = 8) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const txResponse = await provider.getTransaction(txHash)
    if (txResponse !== null) {
      return txResponse
    }
    if (attempt < maxAttempts - 1) {
      const exponentialDelay = 2 ** attempt * 1000 // 1000, 2000, 4000, 8000, 16000, 32000
      await delay(exponentialDelay)
    }
  }
  throw new Error('Transaction not found')
}

export const checkSafeActivation = async (
  provider: Provider,
  txHash: string,
  safeAddress: string,
  type: PayMethod,
  chainId: string,
  startBlock?: number,
) => {
  try {
    const txResponse = await retryGetTransaction(provider, txHash)

    const replaceableTx = startBlock ? txResponse.replaceableTransaction(startBlock) : txResponse
    const receipt = await replaceableTx?.wait(1)

    /** The receipt should always be non-null as we require 1 confirmation */
    if (receipt === null) {
      throw new Error('Transaction should have a receipt, but got null instead.')
    }

    if (didRevert(receipt)) {
      safeCreationDispatch(SafeCreationEvent.REVERTED, {
        groupKey: CF_TX_GROUP_KEY,
        error: new Error('Transaction reverted'),
        safeAddress,
      })
    }

    safeCreationDispatch(SafeCreationEvent.SUCCESS, {
      groupKey: CF_TX_GROUP_KEY,
      safeAddress,
      type,
      chainId,
    })
  } catch (err) {
    const _err = err as EthersError

    if (_err.reason === 'replaced' || _err.reason === 'repriced') {
      safeCreationDispatch(SafeCreationEvent.SUCCESS, {
        groupKey: CF_TX_GROUP_KEY,
        safeAddress,
        type,
        chainId,
      })
      return
    }

    if (didRevert(_err.receipt)) {
      safeCreationDispatch(SafeCreationEvent.REVERTED, {
        groupKey: CF_TX_GROUP_KEY,
        error: new Error('Transaction reverted'),
        safeAddress,
      })
      return
    }

    safeCreationDispatch(SafeCreationEvent.FAILED, {
      groupKey: CF_TX_GROUP_KEY,
      error: _err,
      safeAddress,
    })
  }
}

export const checkSafeActionViaRelay = (taskId: string, safeAddress: string, type: PayMethod, chainId: string) => {
  const TIMEOUT_TIME = 2 * 60 * 1000 // 2 minutes

  let intervalId: NodeJS.Timeout
  let failAfterTimeoutId: NodeJS.Timeout

  intervalId = setInterval(async () => {
    const status = await getRelayTxStatus(taskId)

    // 404
    if (!status) return

    switch (status.task.taskState) {
      case TaskState.ExecSuccess:
        safeCreationDispatch(SafeCreationEvent.SUCCESS, {
          groupKey: CF_TX_GROUP_KEY,
          safeAddress,
          type,
          chainId,
        })
        break
      case TaskState.ExecReverted:
      case TaskState.Blacklisted:
      case TaskState.Cancelled:
      case TaskState.NotFound:
        safeCreationDispatch(SafeCreationEvent.FAILED, {
          groupKey: CF_TX_GROUP_KEY,
          error: new Error('Transaction failed'),
          safeAddress,
        })
        break
      default:
        // Don't clear interval as we're still waiting for the tx to be relayed
        return
    }

    clearTimeout(failAfterTimeoutId)
    clearInterval(intervalId)
  }, POLLING_INTERVAL)

  failAfterTimeoutId = setTimeout(() => {
    safeCreationDispatch(SafeCreationEvent.FAILED, {
      groupKey: CF_TX_GROUP_KEY,
      error: new Error('Transaction failed'),
      safeAddress,
    })

    clearInterval(intervalId)
  }, TIMEOUT_TIME)
}

export const isReplayedSafeProps = (props: UndeployedSafeProps): props is ReplayedSafeProps =>
  'safeAccountConfig' in props && 'masterCopy' in props && 'factoryAddress' in props && 'saltNonce' in props

export const isPredictedSafeProps = (props: UndeployedSafeProps): props is PredictedSafeProps =>
  'safeAccountConfig' in props && !('masterCopy' in props)

export const determineMasterCopyVersion = (masterCopy: string, chainId: string): SafeVersion | undefined => {
  const SAFE_VERSIONS: SafeVersion[] = ['1.4.1', '1.3.0', '1.2.0', '1.1.1', '1.0.0']
  return SAFE_VERSIONS.find((version) => {
    const isL1Singleton = () => {
      const deployments = getSafeSingletonDeployments({ version })?.networkAddresses[chainId]

      if (Array.isArray(deployments)) {
        return deployments.some((deployment) => sameAddress(masterCopy, deployment))
      }
      return sameAddress(masterCopy, deployments)
    }

    const isL2Singleton = () => {
      const deployments = getSafeL2SingletonDeployments({ version })?.networkAddresses[chainId]

      if (Array.isArray(deployments)) {
        return deployments.some((deployment) => sameAddress(masterCopy, deployment))
      }
      return sameAddress(masterCopy, deployments)
    }

    return isL1Singleton() || isL2Singleton()
  })
}

export const extractCounterfactualSafeSetup = (
  undeployedSafe: UndeployedSafe | undefined,
  chainId: string | undefined,
):
  | {
      owners: string[]
      threshold: number
      fallbackHandler: string | undefined
      safeVersion: SafeVersion | undefined
      saltNonce: string | undefined
    }
  | undefined => {
  if (!undeployedSafe || !chainId || !undeployedSafe.props.safeAccountConfig) {
    return undefined
  }
  const { owners, threshold, fallbackHandler } = undeployedSafe.props.safeAccountConfig
  const { safeVersion, saltNonce } = isPredictedSafeProps(undeployedSafe.props)
    ? (undeployedSafe.props.safeDeploymentConfig ?? {})
    : undeployedSafe.props

  return {
    owners,
    threshold: Number(threshold),
    fallbackHandler,
    safeVersion,
    saltNonce,
  }
}

export const activateReplayedSafe = async (
  chain: ChainInfo,
  props: ReplayedSafeProps,
  provider: BrowserProvider,
  options: DeploySafeProps['options'],
) => {
  const data = encodeSafeCreationTx(props, chain)

  return (await provider.getSigner()).sendTransaction({
    ...options,
    to: props.factoryAddress,
    data,
    value: '0',
  })
}
