import type { SafeVersion } from '@safe-global/safe-core-sdk-types'
import { type Eip1193Provider, type Provider } from 'ethers'
import semverSatisfies from 'semver/functions/satisfies'

import { getSafeInfo, type SafeInfo, type ChainInfo, relayTransaction } from '@safe-global/safe-gateway-typescript-sdk'
import { getReadOnlyProxyFactoryContract } from '@/services/contracts/safeContracts'
import type { UrlObject } from 'url'
import { AppRoutes } from '@/config/routes'
import { SAFE_APPS_EVENTS, trackEvent } from '@/services/analytics'
import { predictSafeAddress, SafeFactory, SafeProvider } from '@safe-global/protocol-kit'
import type { DeploySafeProps, PredictedSafeProps } from '@safe-global/protocol-kit'
import { isValidSafeVersion } from '@/hooks/coreSDK/safeCoreSDK'

import { backOff } from 'exponential-backoff'
import { EMPTY_DATA, ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { getLatestSafeVersion } from '@/utils/chains'
import {
  getCompatibilityFallbackHandlerDeployment,
  getProxyFactoryDeployment,
  getSafeL2SingletonDeployment,
  getSafeSingletonDeployment,
  getSafeToL2SetupDeployment,
} from '@safe-global/safe-deployments'
import { ECOSYSTEM_ID_ADDRESS } from '@/config/constants'
import type { ReplayedSafeProps, UndeployedSafeProps } from '@/store/slices'
import { activateReplayedSafe, isPredictedSafeProps } from '@/features/counterfactual/utils'
import { getSafeContractDeployment } from '@/services/contracts/deployments'
import { Safe__factory, Safe_proxy_factory__factory, Safe_to_l2_setup__factory } from '@/types/contracts'
import { createWeb3 } from '@/hooks/wallets/web3'
import { hasMultiChainCreationFeatures } from '@/features/multichain/utils/utils'

export type SafeCreationProps = {
  owners: string[]
  threshold: number
  saltNonce: number
}

const getSafeFactory = async (
  provider: Eip1193Provider,
  safeVersion: SafeVersion,
  isL1SafeSingleton?: boolean,
): Promise<SafeFactory> => {
  if (!isValidSafeVersion(safeVersion)) {
    throw new Error('Invalid Safe version')
  }
  return SafeFactory.init({ provider, safeVersion, isL1SafeSingleton })
}

/**
 * Create a Safe creation transaction via Core SDK and submits it to the wallet
 */
export const createNewSafe = async (
  provider: Eip1193Provider,
  undeployedSafeProps: UndeployedSafeProps,
  safeVersion: SafeVersion,
  chain: ChainInfo,
  options: DeploySafeProps['options'],
  callback: (txHash: string) => void,
  isL1SafeSingleton?: boolean,
): Promise<void> => {
  const safeFactory = await getSafeFactory(provider, safeVersion, isL1SafeSingleton)

  if (isPredictedSafeProps(undeployedSafeProps)) {
    await safeFactory.deploySafe({ ...undeployedSafeProps, options, callback })
  } else {
    const txResponse = await activateReplayedSafe(chain, undeployedSafeProps, createWeb3(provider), options)
    callback(txResponse.hash)
  }
}

/**
 * Compute the new counterfactual Safe address before it is actually created
 */
export const computeNewSafeAddress = async (
  provider: Eip1193Provider | string,
  props: DeploySafeProps,
  chain: ChainInfo,
  safeVersion?: SafeVersion,
): Promise<string> => {
  const safeProvider = new SafeProvider({ provider })

  return predictSafeAddress({
    safeProvider,
    chainId: BigInt(chain.chainId),
    safeAccountConfig: props.safeAccountConfig,
    safeDeploymentConfig: {
      saltNonce: props.saltNonce,
      safeVersion: safeVersion ?? getLatestSafeVersion(chain),
    },
  })
}

export const encodeSafeSetupCall = (safeAccountConfig: ReplayedSafeProps['safeAccountConfig']) => {
  return Safe__factory.createInterface().encodeFunctionData('setup', [
    safeAccountConfig.owners,
    safeAccountConfig.threshold,
    safeAccountConfig.to,
    safeAccountConfig.data,
    safeAccountConfig.fallbackHandler,
    ZERO_ADDRESS,
    0,
    safeAccountConfig.paymentReceiver,
  ])
}

/**
 * Encode a Safe creation transaction NOT using the Core SDK because it doesn't support that
 * This is used for gas estimation.
 */
export const encodeSafeCreationTx = (undeployedSafe: UndeployedSafeProps, chain: ChainInfo) => {
  const replayedSafeProps = assertNewUndeployedSafeProps(undeployedSafe, chain)

  return Safe_proxy_factory__factory.createInterface().encodeFunctionData('createProxyWithNonce', [
    replayedSafeProps.masterCopy,
    encodeSafeSetupCall(replayedSafeProps.safeAccountConfig),
    BigInt(replayedSafeProps.saltNonce),
  ])
}

export const estimateSafeCreationGas = async (
  chain: ChainInfo,
  provider: Provider,
  from: string,
  undeployedSafe: UndeployedSafeProps,
  safeVersion?: SafeVersion,
): Promise<bigint> => {
  const readOnlyProxyFactoryContract = await getReadOnlyProxyFactoryContract(safeVersion ?? getLatestSafeVersion(chain))
  const encodedSafeCreationTx = encodeSafeCreationTx(undeployedSafe, chain)

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
  if (!redirectUrl || !redirectUrl.startsWith(AppRoutes.apps.index)) {
    return { pathname: AppRoutes.home, query: { safe: address } }
  }

  // Otherwise, redirect to the provided URL (e.g. from a Safe App)

  // Track the redirect to Safe App
  trackEvent(SAFE_APPS_EVENTS.SHARED_APP_OPEN_AFTER_SAFE_CREATION)

  // We're prepending the safe address directly here because the `router.push` doesn't parse
  // The URL for already existing query params
  // TODO: Check if we can accomplish this with URLSearchParams or URL instead
  const hasQueryParams = redirectUrl.includes('?')
  const appendChar = hasQueryParams ? '&' : '?'
  return redirectUrl + `${appendChar}safe=${address}`
}

export const relaySafeCreation = async (chain: ChainInfo, undeployedSafeProps: UndeployedSafeProps) => {
  const replayedSafeProps = assertNewUndeployedSafeProps(undeployedSafeProps, chain)
  const encodedSafeCreationTx = encodeSafeCreationTx(replayedSafeProps, chain)

  const relayResponse = await relayTransaction(chain.chainId, {
    to: replayedSafeProps.factoryAddress,
    data: encodedSafeCreationTx,
    version: replayedSafeProps.safeVersion,
  })

  return relayResponse.taskId
}

export type UndeployedSafeWithoutSalt = Omit<ReplayedSafeProps, 'saltNonce'>

/**
 * Creates a new undeployed Safe without default config:
 *
 * Always use the L1 MasterCopy and add a migration to L2 in to the setup.
 * Use our ecosystem ID as paymentReceiver.
 *
 */
export const createNewUndeployedSafeWithoutSalt = (
  safeVersion: SafeVersion,
  safeAccountConfig: Pick<ReplayedSafeProps['safeAccountConfig'], 'owners' | 'threshold'> & {
    paymentReceiver?: string
  },
  chain: ChainInfo,
): UndeployedSafeWithoutSalt => {
  // Create universal deployment Data across chains:
  const fallbackHandlerDeployment = getCompatibilityFallbackHandlerDeployment({
    version: safeVersion,
    network: chain.chainId,
  })
  const fallbackHandlerAddress = fallbackHandlerDeployment?.networkAddresses[chain.chainId]
  const safeL2Deployment = getSafeL2SingletonDeployment({ version: safeVersion, network: chain.chainId })
  const safeL2Address = safeL2Deployment?.networkAddresses[chain.chainId]

  const safeL1Deployment = getSafeSingletonDeployment({ version: safeVersion, network: chain.chainId })
  const safeL1Address = safeL1Deployment?.networkAddresses[chain.chainId]

  const safeFactoryDeployment = getProxyFactoryDeployment({ version: safeVersion, network: chain.chainId })
  const safeFactoryAddress = safeFactoryDeployment?.networkAddresses[chain.chainId]

  if (!safeL2Address || !safeL1Address || !safeFactoryAddress || !fallbackHandlerAddress) {
    throw new Error('No Safe deployment found')
  }

  const safeToL2SetupDeployment = getSafeToL2SetupDeployment({ version: '1.4.1', network: chain.chainId })
  const safeToL2SetupAddress = safeToL2SetupDeployment?.networkAddresses[chain.chainId]
  const safeToL2SetupInterface = Safe_to_l2_setup__factory.createInterface()

  // Only do migration if the chain supports multiChain deployments and has a SafeToL2Setup deployment
  const includeMigration =
    hasMultiChainCreationFeatures(chain) && semverSatisfies(safeVersion, '>=1.4.1') && Boolean(safeToL2SetupAddress)

  const masterCopy = includeMigration ? safeL1Address : chain.l2 ? safeL2Address : safeL1Address

  const replayedSafe: Omit<ReplayedSafeProps, 'saltNonce'> = {
    factoryAddress: safeFactoryAddress,
    masterCopy,
    safeAccountConfig: {
      threshold: safeAccountConfig.threshold,
      owners: safeAccountConfig.owners,
      fallbackHandler: fallbackHandlerAddress,
      to: includeMigration && safeToL2SetupAddress ? safeToL2SetupAddress : ZERO_ADDRESS,
      data: includeMigration ? safeToL2SetupInterface.encodeFunctionData('setupToL2', [safeL2Address]) : EMPTY_DATA,
      paymentReceiver: safeAccountConfig.paymentReceiver ?? ECOSYSTEM_ID_ADDRESS,
    },
    safeVersion,
  }

  return replayedSafe
}

/**
 * Migrates a counterfactual Safe from the pre multichain era to the new predicted Safe data
 * @param predictedSafeProps
 * @param chain
 * @returns
 */
export const migrateLegacySafeProps = (predictedSafeProps: PredictedSafeProps, chain: ChainInfo): ReplayedSafeProps => {
  const safeVersion = predictedSafeProps.safeDeploymentConfig?.safeVersion
  const saltNonce = predictedSafeProps.safeDeploymentConfig?.saltNonce
  const { chainId } = chain
  if (!safeVersion || !saltNonce) {
    throw new Error('Undeployed Safe with incomplete data.')
  }

  const fallbackHandlerDeployment = getCompatibilityFallbackHandlerDeployment({
    version: safeVersion,
    network: chainId,
  })
  const fallbackHandlerAddress = fallbackHandlerDeployment?.defaultAddress

  const masterCopyDeployment = getSafeContractDeployment(chain, safeVersion)
  const masterCopyAddress = masterCopyDeployment?.defaultAddress

  const safeFactoryDeployment = getProxyFactoryDeployment({ version: safeVersion, network: chainId })
  const safeFactoryAddress = safeFactoryDeployment?.defaultAddress

  if (!masterCopyAddress || !safeFactoryAddress || !fallbackHandlerAddress) {
    throw new Error('No Safe deployment found')
  }

  return {
    factoryAddress: safeFactoryAddress,
    masterCopy: masterCopyAddress,
    safeAccountConfig: {
      threshold: predictedSafeProps.safeAccountConfig.threshold,
      owners: predictedSafeProps.safeAccountConfig.owners,
      fallbackHandler: predictedSafeProps.safeAccountConfig.fallbackHandler ?? fallbackHandlerAddress,
      to: predictedSafeProps.safeAccountConfig.to ?? ZERO_ADDRESS,
      data: predictedSafeProps.safeAccountConfig.data ?? EMPTY_DATA,
      paymentReceiver: predictedSafeProps.safeAccountConfig.paymentReceiver ?? ZERO_ADDRESS,
    },
    safeVersion,
    saltNonce,
  }
}

export const assertNewUndeployedSafeProps = (props: UndeployedSafeProps, chain: ChainInfo): ReplayedSafeProps => {
  if (isPredictedSafeProps(props)) {
    return migrateLegacySafeProps(props, chain)
  }

  return props
}
