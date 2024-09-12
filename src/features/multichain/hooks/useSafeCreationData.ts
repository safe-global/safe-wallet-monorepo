import useAsync, { type AsyncResult } from '@/hooks/useAsync'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import { type UndeployedSafe, selectRpc, type ReplayedSafeProps, selectUndeployedSafes } from '@/store/slices'
import { Safe_proxy_factory__factory } from '@/types/contracts'
import { sameAddress } from '@/utils/addresses'
import { getCreationTransaction } from 'safe-client-gateway-sdk'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { useAppSelector } from '@/store'
import { isPredictedSafeProps } from '@/features/counterfactual/utils'
import {
  getReadOnlyGnosisSafeContract,
  getReadOnlyProxyFactoryContract,
  getReadOnlyFallbackHandlerContract,
} from '@/services/contracts/safeContracts'
import { getLatestSafeVersion } from '@/utils/chains'
import { ZERO_ADDRESS, EMPTY_DATA } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { logError } from '@/services/exceptions'
import ErrorCodes from '@/services/exceptions/ErrorCodes'
import { asError } from '@/services/exceptions/utils'

const getUndeployedSafeCreationData = async (
  undeployedSafe: UndeployedSafe,
  chain: ChainInfo,
): Promise<ReplayedSafeProps> => {
  if (isPredictedSafeProps(undeployedSafe.props)) {
    // Copy predicted safe
    // Encode Safe creation and determine the addresses the Safe creation would use
    const { owners, threshold, to, data, fallbackHandler, paymentToken, payment, paymentReceiver } =
      undeployedSafe.props.safeAccountConfig
    const usedSafeVersion = undeployedSafe.props.safeDeploymentConfig?.safeVersion ?? getLatestSafeVersion(chain)
    const readOnlySafeContract = await getReadOnlyGnosisSafeContract(chain, usedSafeVersion)
    const readOnlyProxyFactoryContract = await getReadOnlyProxyFactoryContract(usedSafeVersion)
    const readOnlyFallbackHandlerContract = await getReadOnlyFallbackHandlerContract(usedSafeVersion)

    const callData = {
      owners,
      threshold,
      to: to ?? ZERO_ADDRESS,
      data: data ?? EMPTY_DATA,
      fallbackHandler: fallbackHandler ?? (await readOnlyFallbackHandlerContract.getAddress()),
      paymentToken: paymentToken ?? ZERO_ADDRESS,
      payment: payment ?? 0,
      paymentReceiver: paymentReceiver ?? ZERO_ADDRESS,
    }

    // @ts-ignore union type is too complex
    const setupData = readOnlySafeContract.encode('setup', [
      callData.owners,
      callData.threshold,
      callData.to,
      callData.data,
      callData.fallbackHandler,
      callData.paymentToken,
      callData.payment,
      callData.paymentReceiver,
    ])

    return {
      factoryAddress: await readOnlyProxyFactoryContract.getAddress(),
      masterCopy: await readOnlySafeContract.getAddress(),
      saltNonce: undeployedSafe.props.safeDeploymentConfig?.saltNonce ?? '0',
      setupData,
    }
  }

  // We already have a replayed Safe. In this case we can return the identical data
  return undeployedSafe.props
}

const proxyFactoryInterface = Safe_proxy_factory__factory.createInterface()
const createProxySelector = proxyFactoryInterface.getFunction('createProxyWithNonce').selector

export const SAFE_CREATION_DATA_ERRORS = {
  TX_NOT_FOUND: 'The Safe creation transaction could not be found. Please retry later.',
  NO_CREATION_DATA: 'The Safe creation information for this Safe could be found or is incomplete.',
  UNSUPPORTED_SAFE_CREATION: 'The method this Safe was created with is not supported yet.',
  NO_PROVIDER: 'The RPC provider for the origin network is not available.',
}

const getCreationDataForChain = async (
  chain: ChainInfo,
  undeployedSafe: UndeployedSafe,
  safeAddress: string,
  customRpc: { [chainId: string]: string },
): Promise<ReplayedSafeProps> => {
  // 1. The safe is counterfactual
  if (undeployedSafe) {
    return getUndeployedSafeCreationData(undeployedSafe, chain)
  }

  const { data: creation } = await getCreationTransaction({
    path: {
      chainId: chain.chainId,
      safeAddress,
    },
  })

  if (!creation || !creation.masterCopy || !creation.setupData) {
    throw new Error(SAFE_CREATION_DATA_ERRORS.NO_CREATION_DATA)
  }

  // We need to create a readOnly provider of the deployed chain
  const customRpcUrl = chain ? customRpc?.[chain.chainId] : undefined
  const provider = createWeb3ReadOnly(chain, customRpcUrl)

  if (!provider) {
    throw new Error(SAFE_CREATION_DATA_ERRORS.NO_PROVIDER)
  }

  // Fetch saltNonce by fetching the transaction from the RPC.
  const tx = await provider.getTransaction(creation.transactionHash)
  if (!tx) {
    throw new Error(SAFE_CREATION_DATA_ERRORS.TX_NOT_FOUND)
  }
  const txData = tx.data
  const startOfTx = txData.indexOf(createProxySelector.slice(2, 10))
  if (startOfTx === -1) {
    throw new Error(SAFE_CREATION_DATA_ERRORS.UNSUPPORTED_SAFE_CREATION)
  }

  // decode tx

  const [masterCopy, initializer, saltNonce] = proxyFactoryInterface.decodeFunctionData(
    'createProxyWithNonce',
    `0x${txData.slice(startOfTx)}`,
  )

  const txMatches =
    sameAddress(masterCopy, creation.masterCopy) &&
    (initializer as string)?.toLowerCase().includes(creation.setupData?.toLowerCase())

  if (!txMatches) {
    // We found the wrong tx. This tx seems to deploy multiple Safes at once. This is not supported yet.
    throw new Error(SAFE_CREATION_DATA_ERRORS.UNSUPPORTED_SAFE_CREATION)
  }

  return {
    factoryAddress: creation.factoryAddress,
    masterCopy: creation.masterCopy,
    setupData: creation.setupData,
    saltNonce: saltNonce.toString(),
  }
}

/**
 * Fetches the data with which the given Safe was originally created.
 * Useful to replay a Safe creation.
 */
export const useSafeCreationData = (safeAddress: string, chains: ChainInfo[]): AsyncResult<ReplayedSafeProps> => {
  const customRpc = useAppSelector(selectRpc)

  const undeployedSafes = useAppSelector(selectUndeployedSafes)

  return useAsync<ReplayedSafeProps | undefined>(async () => {
    let lastError: Error | undefined = undefined
    try {
      for (const chain of chains) {
        const undeployedSafe = undeployedSafes[chain.chainId]?.[safeAddress]
        try {
          const creationData = await getCreationDataForChain(chain, undeployedSafe, safeAddress, customRpc)
          return creationData
        } catch (err) {
          lastError = asError(err)
        }
      }
      if (lastError) {
        // We want to know why the creation was not possible by throwing one of the errors
        throw lastError
      }
    } catch (err) {
      logError(ErrorCodes._816, err)
      throw err
    }
  }, [chains, customRpc, safeAddress, undeployedSafes])
}
