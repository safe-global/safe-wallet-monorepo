import type { SafeVersion } from '@safe-global/safe-core-sdk-types'
import { type BrowserProvider, type Provider } from 'ethers'

import { getSafeInfo, type SafeInfo, type ChainInfo, relayTransaction } from '@safe-global/safe-gateway-typescript-sdk'
import {
  getReadOnlyFallbackHandlerContract,
  getReadOnlyGnosisSafeContract,
  getReadOnlyProxyFactoryContract,
  getSuperChainSetupInterface,
} from '@/services/contracts/safeContracts'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { SafeCreationStatus } from '@/components/new-safe/create/steps/StatusStep/useSafeCreation'
import { didRevert, type EthersError } from '@/utils/ethers-utils'
import { Errors, trackError } from '@/services/exceptions'
import { isWalletRejection } from '@/utils/wallets'
import type { PendingSafeTx } from '@/components/new-safe/create/types'
import type { NewSafeFormData } from '@/components/new-safe/create'
import type { UrlObject } from 'url'
import { AppRoutes } from '@/config/routes'
import { SAFE_APPS_EVENTS, trackEvent } from '@/services/analytics'
import type { AppDispatch, AppThunk } from '@/store'
import { showNotification } from '@/store/notificationsSlice'
import { SafeFactory } from '@safe-global/protocol-kit'
import type Safe from '@safe-global/protocol-kit'
import type { DeploySafeProps } from '@safe-global/protocol-kit'
import { createEthersAdapter, isValidSafeVersion } from '@/hooks/coreSDK/safeCoreSDK'

import { backOff } from 'exponential-backoff'
import { LATEST_SAFE_VERSION } from '@/config/constants'
import { EMPTY_DATA, ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { formatError } from '@/utils/formatters'
import {
  ERC4337_MODULE_ADDRESS,
  SUPER_CHAIN_ACCOUNT_GUARD_ADDRESS,
  SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS,
  SUPER_CHAIN_SETUP_ADDRESS,
} from '@/features/superChain/constants'
import type { NounProps } from '../steps/AvatarStep'
import { zeroAddress } from 'viem'

export type SafeCreationProps = {
  owners: string[]
  threshold: number
  saltNonce: number
  id: string
  seed: NounProps
}

/**
 * Prepare data for creating a Safe for the Core SDK
 */
export const getSafeDeployProps = async (
  safeParams: SafeCreationProps,
  callback: (txHash: string) => void,
  chain: ChainInfo,
): Promise<DeploySafeProps & { callback: DeploySafeProps['callback'] }> => {
  const readOnlyFallbackHandlerContract = await getReadOnlyFallbackHandlerContract(chain.chainId, LATEST_SAFE_VERSION)
  const { data, to } = getSuperChainSetupCallData(safeParams.seed, safeParams.id, safeParams.owners[0])
  return {
    safeAccountConfig: {
      threshold: safeParams.threshold,
      owners: safeParams.owners,
      fallbackHandler: await readOnlyFallbackHandlerContract.getAddress(),
      data,
      to,
    },
    saltNonce: safeParams.saltNonce.toString(),
    callback,
  }
}

const getSuperChainSetupCallData = (seed: NounProps, superChainID: string, owner: string) => {
  const moduleManager = getSuperChainSetupInterface()
  return {
    data: moduleManager.encodeFunctionData('setupSuperChainAccount', [
      [ERC4337_MODULE_ADDRESS],
      SUPER_CHAIN_ACCOUNT_MODULE_ADDRESS,
      SUPER_CHAIN_ACCOUNT_GUARD_ADDRESS,
      owner,
      {
        background: seed.background,
        body: seed.body,
        accessory: seed.accessory,
        head: seed.head,
        glasses: seed.glasses,
      },
      superChainID,
    ]),
    to: SUPER_CHAIN_SETUP_ADDRESS,
  }
}

const getSafeFactory = async (
  ethersProvider: BrowserProvider,
  safeVersion = LATEST_SAFE_VERSION,
): Promise<SafeFactory> => {
  if (!isValidSafeVersion(safeVersion)) {
    throw new Error('Invalid Safe version')
  }
  const ethAdapter = await createEthersAdapter(ethersProvider)
  const safeFactory = await SafeFactory.create({ ethAdapter, safeVersion })
  return safeFactory
}

/**
 * Create a Safe creation transaction via Core SDK and submits it to the wallet
 */
export const createNewSafe = async (
  ethersProvider: BrowserProvider,
  props: DeploySafeProps,
  safeVersion?: SafeVersion,
): Promise<Safe> => {
  const safeFactory = await getSafeFactory(ethersProvider, safeVersion)
  return safeFactory.deploySafe(props)
}

/**
 * Compute the new counterfactual Safe address before it is actually created
 */
export const computeNewSafeAddress = async (
  ethersProvider: BrowserProvider,
  props: DeploySafeProps & {
    superChainProps: {
      seed: NounProps
      id: string
    }
  },
): Promise<string> => {
  const safeFactory = await getSafeFactory(ethersProvider)
  const { to, data } = getSuperChainSetupCallData(
    props.superChainProps.seed,
    props.superChainProps.id,
    props.safeAccountConfig.owners[0],
  )
  return safeFactory.predictSafeAddress(
    {
      ...props.safeAccountConfig,
      data,
      to,
    },
    Number(props.saltNonce).toString(),
  )
}

/**
 * Encode a Safe creation transaction NOT using the Core SDK because it doesn't support that
 * This is used for gas estimation.
 */
export const encodeSafeCreationTx = async ({
  owners,
  threshold,
  saltNonce,
  chain,
  id,
  seed,
}: SafeCreationProps & { chain: ChainInfo }) => {
  const readOnlySafeContract = await getReadOnlyGnosisSafeContract(chain, LATEST_SAFE_VERSION)
  const readOnlyProxyContract = await getReadOnlyProxyFactoryContract(chain.chainId, LATEST_SAFE_VERSION)
  const readOnlyFallbackHandlerContract = await getReadOnlyFallbackHandlerContract(chain.chainId, LATEST_SAFE_VERSION)

  const { data, to } = getSuperChainSetupCallData(seed, id, owners[0])

  const setupData = readOnlySafeContract.encode('setup', [
    owners,
    threshold,
    to,
    data,
    await readOnlyFallbackHandlerContract.getAddress(),
    ZERO_ADDRESS,
    '0',
    ZERO_ADDRESS,
  ])

  return readOnlyProxyContract.encode('createProxyWithNonce', [
    await readOnlySafeContract.getAddress(),
    setupData,
    saltNonce,
  ])
}

/**
 * Encode a Safe creation tx in a way that we can store locally and monitor using _waitForTransaction
 */
export const getSafeCreationTxInfo = async (
  provider: Provider,
  owners: NewSafeFormData['owners'],
  threshold: NewSafeFormData['threshold'],
  saltNonce: NewSafeFormData['saltNonce'],
  chain: ChainInfo,
  wallet: ConnectedWallet,
  id: string,
  seed: NounProps,
): Promise<PendingSafeTx> => {
  const readOnlyProxyContract = await getReadOnlyProxyFactoryContract(chain.chainId, LATEST_SAFE_VERSION)

  const data = await encodeSafeCreationTx({
    owners: owners.map((owner) => owner.address),
    threshold,
    saltNonce,
    chain,
    id,
    seed,
  })

  return {
    data,
    from: wallet.address,
    nonce: await provider.getTransactionCount(wallet.address),
    to: await readOnlyProxyContract.getAddress(),
    value: BigInt(0),
    startBlock: await provider.getBlockNumber(),
  }
}

export const estimateSafeCreationGas = async (
  chain: ChainInfo,
  provider: Provider,
  from: string,
  safeParams: SafeCreationProps,
): Promise<bigint> => {
  const readOnlyProxyFactoryContract = await getReadOnlyProxyFactoryContract(chain.chainId, LATEST_SAFE_VERSION)
  const encodedSafeCreationTx = await encodeSafeCreationTx({ ...safeParams, chain })

  const gas = await provider.estimateGas({
    from,
    to: await readOnlyProxyFactoryContract.getAddress(),
    data: encodedSafeCreationTx,
  })

  return gas
}

export const pollSafeInfo = async (chainId: string, safeAddress: string): Promise<SafeInfo> => {
  // exponential delay between attempts for around 4 min
  return backOff(() => getSafeInfo(chainId, safeAddress), {
    startingDelay: 750,
    maxDelay: 20000,
    numOfAttempts: 19,
    retry: (e) => {
      console.info('waiting for client-gateway to provide safe information', e)
      return true
    },
  })
}

export const handleSafeCreationError = (error: EthersError) => {
  trackError(Errors._800, error.message)

  if (isWalletRejection(error)) {
    return SafeCreationStatus.WALLET_REJECTED
  }

  if (error.code === 'TRANSACTION_REPLACED') {
    if (error.reason === 'cancelled') {
      return SafeCreationStatus.ERROR
    } else {
      return SafeCreationStatus.SUCCESS
    }
  }

  if (error.receipt && didRevert(error.receipt)) {
    return SafeCreationStatus.REVERTED
  }

  if (error.code === 'TIMEOUT') {
    return SafeCreationStatus.TIMEOUT
  }

  return SafeCreationStatus.ERROR
}

export const SAFE_CREATION_ERROR_KEY = 'create-safe-error'
export const showSafeCreationError = (error: EthersError | Error): AppThunk => {
  return (dispatch) => {
    dispatch(
      showNotification({
        message: `Your transaction was unsuccessful. Reason: ${formatError(error)}`,
        detailedMessage: error.message,
        groupKey: SAFE_CREATION_ERROR_KEY,
        variant: 'error',
      }),
    )
  }
}

export const checkSafeCreationTx = async (
  provider: Provider,
  pendingTx: PendingSafeTx,
  txHash: string,
  dispatch: AppDispatch,
): Promise<SafeCreationStatus> => {
  const TIMEOUT_TIME = 60 * 1000 // 1 minute

  try {
    // TODO: Use the fix from checkSafeActivation to detect cancellation and speed-up txs again
    const receipt = await provider.waitForTransaction(txHash, 1, TIMEOUT_TIME)

    /** The receipt should always be non-null as we require 1 confirmation */
    if (receipt === null) {
      throw new Error('Transaction should have a receipt, but got null instead.')
    }

    if (didRevert(receipt)) {
      return SafeCreationStatus.REVERTED
    }

    return SafeCreationStatus.SUCCESS
  } catch (err) {
    const _err = err as EthersError

    const status = handleSafeCreationError(_err)

    if (status !== SafeCreationStatus.SUCCESS) {
      dispatch(showSafeCreationError(_err))
    }

    return status
  }
}

export const CREATION_MODAL_QUERY_PARM = 'showCreationModal'

export const getRedirect = (
  chainPrefix: string,
  safeAddress: string,
  redirectQuery?: string | string[],
): UrlObject | string => {
  const redirectUrl = Array.isArray(redirectQuery) ? redirectQuery[0] : redirectQuery
  const address = `${chainPrefix}:${safeAddress}`

  // Should never happen in practice
  if (!chainPrefix) return AppRoutes.index

  // Go to the dashboard if no specific redirect is provided
  if (!redirectUrl) {
    return { pathname: AppRoutes.home, query: { safe: address, [CREATION_MODAL_QUERY_PARM]: true } }
  }

  // Otherwise, redirect to the provided URL (e.g. from a Safe App)

  // Track the redirect to Safe App
  // TODO: Narrow this down to /apps only
  if (redirectUrl.includes('apps')) {
    trackEvent(SAFE_APPS_EVENTS.SHARED_APP_OPEN_AFTER_SAFE_CREATION)
  }

  // We're prepending the safe address directly here because the `router.push` doesn't parse
  // The URL for already existing query params
  // TODO: Check if we can accomplish this with URLSearchParams or URL instead
  const hasQueryParams = redirectUrl.includes('?')
  const appendChar = hasQueryParams ? '&' : '?'
  return redirectUrl + `${appendChar}safe=${address}`
}

export const relaySafeCreation = async (
  chain: ChainInfo,
  owners: string[],
  threshold: number,
  saltNonce: number,
  version?: SafeVersion,
) => {
  const safeVersion = version ?? LATEST_SAFE_VERSION

  const readOnlyProxyFactoryContract = await getReadOnlyProxyFactoryContract(chain.chainId, safeVersion)
  const proxyFactoryAddress = await readOnlyProxyFactoryContract.getAddress()
  const readOnlyFallbackHandlerContract = await getReadOnlyFallbackHandlerContract(chain.chainId, safeVersion)
  const fallbackHandlerAddress = await readOnlyFallbackHandlerContract.getAddress()
  const readOnlySafeContract = await getReadOnlyGnosisSafeContract(chain)
  const safeContractAddress = await readOnlySafeContract.getAddress()

  const callData = {
    owners,
    threshold,
    to: ZERO_ADDRESS,
    data: EMPTY_DATA,
    fallbackHandler: fallbackHandlerAddress,
    paymentToken: ZERO_ADDRESS,
    payment: 0,
    paymentReceiver: ZERO_ADDRESS,
  }

  const initializer = readOnlySafeContract.encode('setup', [
    callData.owners,
    callData.threshold,
    callData.to,
    callData.data,
    callData.fallbackHandler,
    callData.paymentToken,
    callData.payment,
    callData.paymentReceiver,
  ])

  const createProxyWithNonceCallData = readOnlyProxyFactoryContract.encode('createProxyWithNonce', [
    safeContractAddress,
    initializer,
    saltNonce,
  ])

  const relayResponse = await relayTransaction(chain.chainId, {
    to: proxyFactoryAddress,
    data: createProxyWithNonceCallData,
    version: safeVersion,
  })

  return relayResponse.taskId
}
