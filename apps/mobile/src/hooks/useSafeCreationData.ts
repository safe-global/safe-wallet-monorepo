import semverSatisfies from 'semver/functions/satisfies'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'
import { useLazyTransactionsGetCreationTransactionV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useAppSelector } from '@/src/store/hooks'
import { selectAllChains } from '@/src/store/chains'
import { asError } from '@safe-global/utils/services/exceptions/utils'
import Logger from '@/src/utils/logger'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { Safe__factory, Safe_proxy_factory__factory } from '@safe-global/utils/types/contracts'
import type { SafeAccountConfig } from '@safe-global/protocol-kit'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import {
  getSafeL2SingletonDeployments,
  getSafeSingletonDeployments,
  getSafeToL2SetupDeployment,
} from '@safe-global/safe-deployments'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { createWeb3ReadOnly } from '@/src/hooks/wallets/web3'
import useAsync from '@safe-global/utils/hooks/useAsync'
import type { SafeVersion } from '@safe-global/types-kit'

export const SAFE_CREATION_DATA_ERRORS = {
  TX_NOT_FOUND: 'The Safe creation transaction could not be found. Please retry later.',
  NO_CREATION_DATA: 'The Safe creation information for this Safe could not be found or is incomplete.',
  UNSUPPORTED_SAFE_CREATION: 'The method this Safe was created with is not supported.',
  NO_PROVIDER: 'The RPC provider for the origin network is not available.',
  LEGACY_COUNTERFATUAL: 'This undeployed Safe cannot be replayed. Please activate the Safe first.',
  PAYMENT_SAFE: 'The Safe creation used reimbursement. Adding networks to such Safes is not supported.',
  UNSUPPORTED_IMPLEMENTATION:
    'The Safe was created using an unsupported or outdated implementation. Adding networks to this Safe is not possible.',
  UNKNOWN_SETUP_MODULES: 'The Safe creation is using an unknown internal call',
}

const determineMasterCopyVersion = (masterCopy: string, chainId: string): SafeVersion | undefined => {
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

export const decodeSetupData = (setupData: string): ReplayedSafeProps['safeAccountConfig'] => {
  const [owners, threshold, to, data, fallbackHandler, paymentToken, payment, paymentReceiver] =
    Safe__factory.createInterface().decodeFunctionData('setup', setupData)

  return {
    owners: [...owners],
    threshold: Number(threshold),
    to,
    data,
    fallbackHandler,
    paymentToken,
    payment: Number(payment),
    paymentReceiver,
  }
}

const validateAccountConfig = (safeAccountConfig: SafeAccountConfig) => {
  // Safes that used the reimbursement logic are not supported
  if (
    (safeAccountConfig.payment && safeAccountConfig.payment > 0) ||
    (safeAccountConfig.paymentToken && safeAccountConfig.paymentToken !== ZERO_ADDRESS)
  ) {
    throw new Error(SAFE_CREATION_DATA_ERRORS.PAYMENT_SAFE)
  }

  const setupToL2Address = getSafeToL2SetupDeployment({ version: '1.4.1' })?.defaultAddress
  if (safeAccountConfig.to !== ZERO_ADDRESS && !sameAddress(safeAccountConfig.to, setupToL2Address)) {
    // Unknown setupModules calls cannot be replayed as the target contract is likely not deployed across chains
    throw new Error(SAFE_CREATION_DATA_ERRORS.UNKNOWN_SETUP_MODULES)
  }
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
  chain: Chain,
  safeAddress: string,
  getCreationTransaction: ReturnType<typeof useLazyTransactionsGetCreationTransactionV1Query>,
): Promise<ReplayedSafeProps> => {
  const [trigger] = getCreationTransaction
  const creation = await trigger({ chainId: chain.chainId, safeAddress })

  if (!creation.data || !creation.data.masterCopy || !creation.data.setupData || creation.data.setupData === '0x') {
    throw new Error(SAFE_CREATION_DATA_ERRORS.NO_CREATION_DATA)
  }

  // Safes that were deployed with an unknown mastercopy or < 1.3.0 are not supported.
  const safeVersion = determineMasterCopyVersion(creation.data.masterCopy, chain.chainId)
  if (!safeVersion || semverSatisfies(safeVersion, '<1.3.0')) {
    throw new Error(SAFE_CREATION_DATA_ERRORS.UNSUPPORTED_IMPLEMENTATION)
  }

  const safeAccountConfig = decodeSetupData(creation.data.setupData)

  validateAccountConfig(safeAccountConfig)

  const provider = createWeb3ReadOnly(chain)

  if (!provider) {
    throw new Error(SAFE_CREATION_DATA_ERRORS.NO_PROVIDER)
  }

  // Fetch saltNonce by fetching the transaction from the RPC.
  const tx = await provider.getTransaction(creation.data.transactionHash)
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
    sameAddress(masterCopy, creation.data.masterCopy) &&
    (initializer as string)?.toLowerCase().includes(creation.data.setupData?.toLowerCase())

  if (!txMatches) {
    // We found the wrong tx. This tx seems to deploy multiple Safes at once. This is not supported yet.
    throw new Error(SAFE_CREATION_DATA_ERRORS.UNSUPPORTED_SAFE_CREATION)
  }

  return {
    factoryAddress: creation.data.factoryAddress,
    masterCopy: creation.data.masterCopy,
    safeAccountConfig,
    saltNonce: saltNonce.toString(),
    safeVersion,
  }
}

export const useSafeCreationData = () => {
  const getCreationTransaction = useLazyTransactionsGetCreationTransactionV1Query()
  const allChains = useAppSelector(selectAllChains)
  const activeSafe = useDefinedActiveSafe()

  return useAsync<ReplayedSafeProps | undefined>(async () => {
    let lastError: Error | undefined = undefined
    try {
      for (const chain of allChains) {
        try {
          return await getCreationDataForChain(chain, activeSafe.address, getCreationTransaction)
        } catch (err) {
          lastError = asError(err)
        }
      }
      if (lastError) {
        // We want to know why the creation was not possible by throwing one of the errors
        throw lastError
      }
    } catch (err) {
      Logger.error(ErrorCodes._816, err)
      throw err
    }
  }, [allChains, activeSafe.address])
}
