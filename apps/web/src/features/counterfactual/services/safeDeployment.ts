import { ImplementationVersionState } from '@safe-global/store/gateway/types'
import { POLLING_INTERVAL } from '@/config/constants'
import { safeCreationDispatch, SafeCreationEvent } from './safeCreationEvents'
import { extractCounterfactualSafeSetup } from './typeGuards'
import { addUndeployedSafe } from '../store/undeployedSafesSlice'
import type { UndeployedSafe, ReplayedSafeProps, PayMethod } from '../types'
import { PendingSafeStatus } from '../types'
import { CF_TX_GROUP_KEY } from '../constants'
import { type ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import { getSafeSDKWithSigner, getUncheckedSigner, tryOffChainTxSigning } from '@/services/tx/tx-sender/sdk'
import { getRelayTxStatus, TaskState } from '@/services/tx/txMonitor'
import type { AppDispatch } from '@/store'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { didRevert, type EthersError } from '@/utils/ethers-utils'
import { assertProvider, assertTx, assertWallet } from '@/utils/helpers'
import type { SafeTransaction, TransactionOptions } from '@safe-global/types-kit'
import { type Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { BrowserProvider, Eip1193Provider, Provider, TransactionResponse } from 'ethers'

import { encodeSafeCreationTx } from '@/components/new-safe/create/logic'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'
import { delay } from '@safe-global/utils/utils/helpers'

export const getUndeployedSafeInfo = (undeployedSafe: UndeployedSafe, address: string, chain: Chain) => {
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

export const dispatchTxExecutionAndDeploySafe = async (
  safeTx: SafeTransaction,
  txOptions: TransactionOptions,
  provider: Eip1193Provider,
  safeAddress: string,
) => {
  const sdk = await getSafeSDKWithSigner(provider)
  const eventParams = { groupKey: CF_TX_GROUP_KEY }

  let result: TransactionResponse | undefined
  try {
    const signedTx = await tryOffChainTxSigning(safeTx, sdk)
    const signer = await getUncheckedSigner(provider)

    const deploymentTx = await sdk.wrapSafeTransactionIntoDeploymentBatch(signedTx, txOptions)

    // We need to estimate the actual gasLimit after the user has signed since it is more accurate than what useDeployGasLimit returns
    const gas = await signer.estimateGas({ data: deploymentTx.data, value: deploymentTx.value, to: deploymentTx.to })

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

// Re-export lightweight balance getter (extracted to separate file to reduce bundle size)
export { getCounterfactualBalance } from './getCounterfactualBalance'

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

// Re-export lightweight utilities for backwards compatibility within the feature
export { isReplayedSafeProps, isPredictedSafeProps, extractCounterfactualSafeSetup } from './typeGuards'

export const activateReplayedSafe = async (
  chain: Chain,
  props: ReplayedSafeProps,
  provider: BrowserProvider,
  options: TransactionOptions,
) => {
  const data = encodeSafeCreationTx(props, chain)

  return (await provider.getSigner()).sendTransaction({
    ...options,
    to: props.factoryAddress,
    data,
    value: '0',
  })
}
