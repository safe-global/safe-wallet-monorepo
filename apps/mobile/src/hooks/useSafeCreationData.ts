import semverSatisfies from 'semver/functions/satisfies'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'
import { useLazyTransactionsGetCreationTransactionV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import Logger from '@/src/utils/logger'
import ErrorCodes from '@safe-global/utils/services/exceptions/ErrorCodes'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { Safe_proxy_factory__factory } from '@safe-global/utils/types/contracts'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { createWeb3ReadOnly } from '@/src/hooks/wallets/web3'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { RootState } from '@/src/store'
import {
  decodeSetupData,
  determineMasterCopyVersion,
  SAFE_CREATION_DATA_ERRORS,
  validateAccountConfig,
} from '@safe-global/utils/utils/safe'

const proxyFactoryInterface = Safe_proxy_factory__factory.createInterface()
const createProxySelector = proxyFactoryInterface.getFunction('createProxyWithNonce').selector

/**
 * Loads the creation data from the CGW and checks it against
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

/**
 * Checks for a given chainId if the active safe can be recreated on that chain
 * @param chainId
 */
export const useSafeCreationData = (chainId: string) => {
  const getCreationTransaction = useLazyTransactionsGetCreationTransactionV1Query()
  const destinationChain = useAppSelector((state: RootState) => selectChainById(state, chainId))
  const activeSafe = useDefinedActiveSafe()

  return useAsync<ReplayedSafeProps | undefined>(async () => {
    try {
      return await getCreationDataForChain(destinationChain, activeSafe.address, getCreationTransaction)
    } catch (err) {
      Logger.error(ErrorCodes._816, err)
      throw err
    }
  }, [destinationChain, activeSafe.address])
}
