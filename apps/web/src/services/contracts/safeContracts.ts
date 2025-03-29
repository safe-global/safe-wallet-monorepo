import { _isL2 } from '@/services/contracts/deployments'
import { getSafeProvider } from '@/services/tx/tx-sender/sdk'
import { type GetContractProps, SafeProvider } from '@safe-global/protocol-kit'
import {
  getCompatibilityFallbackHandlerContractInstance,
  getMultiSendCallOnlyContractInstance,
  getSafeContractInstance,
  getSafeProxyFactoryContractInstance,
  getSignMessageLibContractInstance,
} from '@safe-global/protocol-kit/dist/src/contracts/contractInstances'
import type SafeBaseContract from '@safe-global/protocol-kit/dist/src/contracts/Safe/SafeBaseContract'
import { type ChainInfo, ImplementationVersionState } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { SafeVersion } from '@safe-global/safe-core-sdk-types'
import { assertValidSafeVersion, getSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import semver from 'semver'
import { getSafeMigrationDeployment } from '@safe-global/safe-deployments'
import { SAFE_TO_L2_MIGRATION_VERSION } from '@/utils/safe-migrations'
import { getLatestSafeVersion } from '@safe-global/utils/utils/chains'

// `UNKNOWN` is returned if the mastercopy does not match supported ones
// @see https://github.com/safe-global/safe-client-gateway/blob/main/src/routes/safes/handlers/safes.rs#L28-L31
//      https://github.com/safe-global/safe-client-gateway/blob/main/src/routes/safes/converters.rs#L77-L79
export const isValidMasterCopy = (implementationVersionState: SafeInfo['implementationVersionState']): boolean => {
  return implementationVersionState !== ImplementationVersionState.UNKNOWN
}

export const _getValidatedGetContractProps = (
  safeVersion: SafeInfo['version'],
): Pick<GetContractProps, 'safeVersion'> => {
  assertValidSafeVersion(safeVersion)

  // SDK request here: https://github.com/safe-global/safe-core-sdk/issues/261
  // Remove '+L2'/'+Circles' metadata from version
  const [noMetadataVersion] = safeVersion.split('+')

  return {
    safeVersion: noMetadataVersion as SafeVersion,
  }
}

// GnosisSafe

const getGnosisSafeContract = async (safe: SafeInfo, safeProvider: SafeProvider) => {
  return getSafeContractInstance(
    _getValidatedGetContractProps(safe.version).safeVersion,
    safeProvider,
    safe.address.value,
  )
}

export const getReadOnlyCurrentGnosisSafeContract = async (safe: SafeInfo): Promise<SafeBaseContract<any>> => {
  const safeSDK = getSafeSDK()
  if (!safeSDK) {
    throw new Error('Safe SDK not found.')
  }

  const safeProvider = safeSDK.getSafeProvider()

  return getGnosisSafeContract(safe, safeProvider)
}

export const getCurrentGnosisSafeContract = async (safe: SafeInfo, provider: string) => {
  const safeProvider = new SafeProvider({ provider })

  return getGnosisSafeContract(safe, safeProvider)
}

export const getReadOnlyGnosisSafeContract = async (
  chain: ChainInfo,
  safeVersion: SafeInfo['version'],
  isL1?: boolean,
) => {
  const version = safeVersion ?? getLatestSafeVersion(chain)

  const safeProvider = getSafeProvider()

  const isL1SafeSingleton = isL1 ?? !_isL2(chain, _getValidatedGetContractProps(version).safeVersion)

  return getSafeContractInstance(
    _getValidatedGetContractProps(version).safeVersion,
    safeProvider,
    undefined,
    undefined,
    isL1SafeSingleton,
  )
}

// MultiSend

export const _getMinimumMultiSendCallOnlyVersion = (safeVersion: SafeInfo['version']) => {
  const INITIAL_CALL_ONLY_VERSION = '1.3.0'

  if (!safeVersion) {
    return INITIAL_CALL_ONLY_VERSION
  }

  return semver.gte(safeVersion, INITIAL_CALL_ONLY_VERSION) ? safeVersion : INITIAL_CALL_ONLY_VERSION
}

export const getReadOnlyMultiSendCallOnlyContract = async (safeVersion: SafeInfo['version']) => {
  const safeSDK = getSafeSDK()
  if (!safeSDK) {
    throw new Error('Safe SDK not found.')
  }

  const safeProvider = safeSDK.getSafeProvider()

  return getMultiSendCallOnlyContractInstance(_getValidatedGetContractProps(safeVersion).safeVersion, safeProvider)
}

// GnosisSafeProxyFactory

export const getReadOnlyProxyFactoryContract = async (safeVersion: SafeInfo['version'], contractAddress?: string) => {
  const safeProvider = getSafeProvider()

  return getSafeProxyFactoryContractInstance(
    _getValidatedGetContractProps(safeVersion).safeVersion,
    safeProvider,
    safeProvider.getExternalProvider(),
    contractAddress,
  )
}

// Fallback handler

export const getReadOnlyFallbackHandlerContract = async (safeVersion: SafeInfo['version']) => {
  const safeProvider = getSafeProvider()

  return getCompatibilityFallbackHandlerContractInstance(
    _getValidatedGetContractProps(safeVersion).safeVersion,
    safeProvider,
  )
}

// Sign messages deployment

export const getReadOnlySignMessageLibContract = async (safeVersion: SafeInfo['version']) => {
  const safeSDK = getSafeSDK()
  if (!safeSDK) {
    throw new Error('Safe SDK not found.')
  }

  const safeProvider = safeSDK.getSafeProvider()

  return getSignMessageLibContractInstance(_getValidatedGetContractProps(safeVersion).safeVersion, safeProvider)
}

export const isMigrationToL2Possible = (safe: SafeInfo): boolean => {
  return (
    safe.nonce === 0 &&
    Boolean(
      getSafeMigrationDeployment({ network: safe.chainId, version: SAFE_TO_L2_MIGRATION_VERSION })?.networkAddresses[
        safe.chainId
      ],
    )
  )
}
