import useAsync, { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { createWeb3ReadOnly } from '@/hooks/wallets/web3'
import { selectRpc, selectUndeployedSafes } from '@/store/slices'
import { type UndeployedSafe, type ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'
import { Safe_proxy_factory__factory } from '@safe-global/utils/types/contracts'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { getCreationTransaction } from '@safe-global/safe-client-gateway-sdk'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { useAppSelector } from '@/store'
import { isPredictedSafeProps } from '@/features/counterfactual/utils'
import { logError } from '@/services/exceptions'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import semverSatisfies from 'semver/functions/satisfies'
import {
  decodeSetupData,
  determineMasterCopyVersion,
  SAFE_CREATION_DATA_ERRORS,
  validateAccountConfig,
} from '@safe-global/utils/utils/safe'

const getUndeployedSafeCreationData = async (undeployedSafe: UndeployedSafe): Promise<ReplayedSafeProps> => {
  if (isPredictedSafeProps(undeployedSafe.props)) {
    throw new Error(SAFE_CREATION_DATA_ERRORS.LEGACY_COUNTERFATUAL)
  }

  // We already have a replayed Safe. In this case we can return the identical data
  return undeployedSafe.props
}

const proxyFactoryInterface = Safe_proxy_factory__factory.createInterface()
const createProxySelector = proxyFactoryInterface.getFunction('createProxyWithNonce').selector

/**
 * Loads the creation data from the CGW or infers it from an undeployed Safe.
 *
 * Throws errors for the reasons in {@link SAFE_CREATION_DATA_ERRORS}.
 * Checking the cheap cases not requiring RPC calls first.
 */
const getCreationDataForChain = async (
  chain: ChainInfo,
  undeployedSafe: UndeployedSafe,
  safeAddress: string,
  customRpc: { [chainId: string]: string },
): Promise<ReplayedSafeProps> => {
  // 1. The safe is counterfactual
  if (undeployedSafe) {
    const undeployedCreationData = await getUndeployedSafeCreationData(undeployedSafe)
    validateAccountConfig(undeployedCreationData.safeAccountConfig)

    return undeployedCreationData
  }

  const creation = await getCreationTransaction({
    params: {
      path: {
        chainId: chain.chainId,
        safeAddress,
      },
    },
  })

  if (!creation || !creation.masterCopy || !creation.setupData || creation.setupData === '0x') {
    throw new Error(SAFE_CREATION_DATA_ERRORS.NO_CREATION_DATA)
  }

  // Safes that were deployed with an unknown mastercopy or < 1.3.0 are not supported.
  const safeVersion = determineMasterCopyVersion(creation.masterCopy, chain.chainId)
  if (!safeVersion || semverSatisfies(safeVersion, '<1.3.0')) {
    throw new Error(SAFE_CREATION_DATA_ERRORS.UNSUPPORTED_IMPLEMENTATION)
  }

  const safeAccountConfig = decodeSetupData(creation.setupData)

  validateAccountConfig(safeAccountConfig)

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
    safeAccountConfig,
    saltNonce: saltNonce.toString(),
    safeVersion,
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
          return await getCreationDataForChain(chain, undeployedSafe, safeAddress, customRpc)
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
